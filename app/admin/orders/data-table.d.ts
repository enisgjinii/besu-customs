import React from "react";
import { ColumnDef } from "@tanstack/react-table";

declare module "@/app/admin/orders/data-table" {
  export interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
  }

  export function DataTable<TData, TValue>(
    props: DataTableProps<TData, TValue>,
  ): React.ReactElement;
}
