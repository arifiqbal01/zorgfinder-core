import React, { useEffect, useState } from "react";
import { Card, Button } from "../../../../ui";
import ProviderLogo from "../../../../ui/ProviderLogo";
import Icon from "../../../../ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../../../../ui/Table";
import { getCache, setCache, clearCache } from "@utils/cache";



const ICON_VIEW = "M12 5v14M5 12h14";


export default function Favourites() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/wp-json/zorg/v1/favourites?per_page=100&page=1", {
      credentials: "include",
      headers: {
        "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
      },
    })
      .then((r) => r.json())
      .then((json) => setRows(json?.data || []));
  }, []);

  useEffect(() => {
  const cached = getCache("dashboard_favourites");
  if (cached) {
    setRows(cached);
    return;
  }

  fetch("/wp-json/zorg/v1/favourites?per_page=100&page=1", {
    credentials: "include",
    headers: { "X-WP-Nonce": window?.zorgFinderApp?.nonce || "" },
  })
    .then(r => r.json())
    .then(json => {
      const rows = json?.data || [];
      setRows(rows);
      setCache("dashboard_favourites", rows);
    });
}, []);

  return (
    <Card className="p-0 max-w-6xl">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Favourites</h2>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>Provider</Th>
            <Th>Saved</Th>
            <Th align="right">Action</Th>
          </tr>
        </Thead>

        <Tbody>
          {rows.map((row) => (
            <Tr key={row.favourite_id}>
              <Td>
                <div className="flex items-center gap-3">
                  <ProviderLogo
                    name={row.provider_name}
                    size={28}
                  />
                  <span className="font-medium truncate">
                    {row.provider_name}
                  </span>
                </div>
              </Td>

              <Td className="text-gray-500">
                {new Date(row.created_at).toLocaleDateString()}
              </Td>

              <Td align="right">
                <Button
                  as="a"
                  href={`/provider/${row.provider_id}`}
                  variant="ghost"
                  className="inline-flex items-center gap-1"
                >
                  <Icon d={ICON_VIEW} size={16} />
                  View
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
