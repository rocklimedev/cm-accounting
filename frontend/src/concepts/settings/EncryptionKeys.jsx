import React from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  useGetEncryptionKeysQuery,
  useRecordActiveEncryptionKeyMutation,
} from "@/api/encryption-keys.api";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function StatusBadge({ value }) {
  const status = value || "unrecorded";
  const variant = status === "active" ? "default" : "secondary";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export default function EncryptionKeys() {
  const { data, isLoading, isError } = useGetEncryptionKeysQuery();
  const [recordActive, { isLoading: isRecording }] =
    useRecordActiveEncryptionKeyMutation();
  const configuredKeys = data?.configuredKeys ?? [];
  const history = data?.history ?? [];

  return (
    <Layout title="Encryption Keys">
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="border border-border rounded-md p-4 bg-card">
            <div className="text-xs text-foreground/60">Active Version</div>
            <div className="mt-1 text-xl font-semibold">
              {isLoading ? "Loading..." : data?.activeVersion || "-"}
            </div>
          </div>
          <div className="border border-border rounded-md p-4 bg-card">
            <div className="text-xs text-foreground/60">Fingerprint</div>
            <div className="mt-1 text-xl font-semibold font-mono">
              {isLoading ? "Loading..." : data?.activeFingerprint || "-"}
            </div>
          </div>
          <div className="border border-border rounded-md p-4 bg-card">
            <div className="text-xs text-foreground/60">DB Record</div>
            <div className="mt-2">
            {data?.activeRecorded ? (
              <Badge>Recorded</Badge>
            ) : (
              <Badge variant="secondary">Missing</Badge>
            )}
            </div>
          </div>
        </section>

        {!isLoading && !data?.activeRecorded && (
          <div className="border border-border rounded-md p-4 bg-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">
                Active key metadata is not recorded.
              </div>
              <div className="text-xs text-foreground/60">
                Version and fingerprint only; raw key material stays on the server.
              </div>
            </div>
            <Button onClick={() => recordActive()} disabled={isRecording}>
              {isRecording ? "Recording..." : "Record Active Key"}
            </Button>
          </div>
        )}

        {isError && (
          <div className="border border-destructive/40 bg-destructive/10 text-destructive rounded-md px-4 py-3 text-sm">
            Unable to load encryption keys.
          </div>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Configured Server Keys</h2>
          <div className="border border-border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4}>Loading...</TableCell>
                  </TableRow>
                ) : configuredKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>No configured keys found.</TableCell>
                  </TableRow>
                ) : (
                  configuredKeys.map((key) => (
                    <TableRow key={key.version}>
                      <TableCell className="font-medium">{key.version}</TableCell>
                      <TableCell className="font-mono">{key.fingerprint}</TableCell>
                      <TableCell>
                        {key.active ? (
                          <Badge>Active</Badge>
                        ) : (
                          <Badge variant="secondary">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.recorded ? (
                          <Badge variant="secondary">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Database History</h2>
          <div className="border border-border rounded-md overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading...</TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No key history recorded.</TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.key_version}
                      </TableCell>
                      <TableCell className="font-mono">
                        {row.key_fingerprint || "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={row.status} />
                      </TableCell>
                      <TableCell>{row.algorithm || "-"}</TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </Layout>
  );
}
