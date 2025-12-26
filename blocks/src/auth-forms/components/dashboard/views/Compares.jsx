import React, { useEffect, useState } from "react";
import { Card, Button } from "../../../../ui";
import Icon from "../../../../ui/Icon";
import { Table, Thead, Tbody, Tr, Th, Td } from "../../../../ui/Table";
import { getCache, setCache } from "@utils/cache";
import copyToClipboard from "../utils/copyToClipboard";

const ICON_OPEN =
  "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z";
const ICON_SHARE =
  "M18 8a3 3 0 10-2.83-4H15a3 3 0 100 6h.17A3 3 0 1018 8z";

const getComparePageUrl = () =>
  window?.zorgFinderApp?.comparePageUrl || "";

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
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data || [];
        setRows(data);
        setCache("dashboard_compares", data);
      });
  }, []);

  const openCompare = (key) => {
    const base = getComparePageUrl();
    if (!base) return;

    window.open(`${base}?ids=${key}`, "_blank", "noopener");
  };

  const shareCompare = async (key) => {
    const base = getComparePageUrl();
    if (!base) return;

    await copyToClipboard(`${base}?ids=${key}`);
  };

  return (
    <Card className="p-0 max-w-6xl">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Saved comparisons</h2>
      </div>

      <Table>
        <Thead>
          <tr>
            <Th>#</Th>
            <Th>Providers</Th>
            <Th>IDs</Th>
            <Th align="right">Actions</Th>
          </tr>
        </Thead>

        <Tbody>
          {rows.map((key, i) => {
            const ids = key.split(",");
            return (
              <Tr key={key}>
                <Td>{i + 1}</Td>
                <Td>{ids.length} providers</Td>
                <Td className="truncate max-w-xs">{key}</Td>

                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => openCompare(key)}
                    >
                      <Icon d={ICON_OPEN} size={16} /> Open
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => shareCompare(key)}
                    >
                      <Icon d={ICON_SHARE} size={16} /> Share
                    </Button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Card>
  );
}
