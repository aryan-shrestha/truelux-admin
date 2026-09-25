import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the generics must match TanStack's declaration to merge.
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}
