import React, { useEffect, useState } from "react";
import { Card, Button } from "../../../../ui";
import ProviderLogo from "../../../../ui/ProviderLogo";
import Icon from "../../../../ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../../../../ui/Table";
import { getCache, setCache } from "@utils/cache";
import copyToClipboard from "../utils/copyToClipboard";

const ICON_OPEN = "M12 5v14M5 12h14";
const ICON_SHARE =
  "M18 8a3 3 0 10-2.83-4H15a3 3 0 100 6h.17A3 3 0 1018 8z";

const getProvidersPageUrl = () =>
  window?.zorgFinderApp?.providersPageUrl || "";

export default function Favourites() {
  const [rows, setRows] = useState([]);

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
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data || [];
        setRows(data);
        setCache("dashboard_favourites", data);
      });
  }, []);

  const openProvider = (providerName) => {
    const base = getProvidersPageUrl();
    if (!base) return;

    const url = `${base}?search=${encodeURIComponent(providerName)}`;
    window.open(url, "_blank", "noopener");
  };

  const shareProvider = async (providerName) => {
    const base = getProvidersPageUrl();
    if (!base) return;

    const url = `${base}?search=${encodeURIComponent(providerName)}`;
    await copyToClipboard(url);
  };

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
            <Th align="right">Actions</Th>
          </tr>
        </Thead>

        <Tbody>
          {rows.map((row) => (
            <Tr key={row.favourite_id}>
              <Td>
                <div className="flex items-center gap-3">
                  <ProviderLogo name={row.provider_name} size={28} />
                  <span className="font-medium truncate">
                    {row.provider_name}
                  </span>
                </div>
              </Td>

              <Td className="text-gray-500">
                {new Date(row.created_at).toLocaleDateString()}
              </Td>

              <Td align="right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => openProvider(row.provider_name)}
                  >
                    <Icon d={ICON_OPEN} size={16} /> Open
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => shareProvider(row.provider_name)}
                  >
                    <Icon d={ICON_SHARE} size={16} /> Share
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Card>
  );
}
