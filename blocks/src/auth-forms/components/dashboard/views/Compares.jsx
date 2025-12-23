import React, { useEffect, useState } from "react";
import { Card, Button } from "../../../../ui";
import Icon from "../../../../ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../../../../ui/Table";
import { getCache, setCache, clearCache } from "@utils/cache";



const ICON_OPEN =
  "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z";


export default function Compares() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
  const cached = getCache("dashboard_compares");
  if (cached) {
    setRows(cached);
    return;
  }

  fetch("/wp-json/zorg/v1/compare/saved", {
    credentials: "include",
    headers: { "X-WP-Nonce": window?.zorgFinderApp?.nonce || "" },
  })
    .then(r => r.json())
    .then(json => {
      const rows = json?.data || [];
      setRows(rows);
      setCache("dashboard_compares", rows);
    });
}, []);

  useEffect(() => {
    fetch("/wp-json/zorg/v1/compare/saved", {
      credentials: "include",
      headers: {
        "X-WP-Nonce": window?.zorgFinderApp?.nonce || "",
      },
    })
      .then((r) => r.json())
      .then((json) => setRows(json?.data || []));
  }, []);

  return (
    <Card className="p-0 max-w-6xl">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">
          Saved comparisons
        </h2>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>#</Th>
            <Th>Providers</Th>
            <Th>IDs</Th>
            <Th align="right">Action</Th>
          </tr>
        </Thead>

        <Tbody>
          {rows.map((key, i) => {
            const ids = key.split(",");

            return (
              <Tr key={key}>
                <Td className="text-gray-500">
                  {i + 1}
                </Td>

                <Td className="font-medium">
                  {ids.length} providers
                </Td>

                <Td className="text-gray-500 truncate max-w-xs">
                  {key}
                </Td>

                <Td align="right">
                  <Button
                    as="a"
                    href={`/compare?ids=${key}`}
                    variant="ghost"
                    className="inline-flex items-center gap-1"
                  >
                    <Icon d={ICON_OPEN} size={16} />
                    Open
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Card>
  );
}
