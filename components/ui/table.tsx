"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Table Component
 * 
 * A comprehensive table component system using semantic HTML
 * with full accessibility support and customizable styling.
 * 
 * @example
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead>Status</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Item 1</TableCell>
 *       <TableCell>Active</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */

// ============================================================================
// Table Root Component
// ============================================================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Whether the table should have a container with horizontal scroll */
  containerClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, children, ...props }, ref) => (
    <div className={cn("relative w-full overflow-auto", containerClassName)}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

// ============================================================================
// Table Header Component
// ============================================================================

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

// ============================================================================
// Table Body Component
// ============================================================================

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// ============================================================================
// Table Footer Component
// ============================================================================

type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
);
TableFooter.displayName = "TableFooter";

// ============================================================================
// Table Row Component
// ============================================================================

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Whether the row is selected */
  selected?: boolean;
  /** Whether to show hover state */
  hoverable?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors",
        hoverable && "hover:bg-muted/50",
        selected && "bg-muted",
        "data-[state=selected]:bg-muted",
        className
      )}
      data-state={selected ? "selected" : undefined}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// ============================================================================
// Table Head Component (Header Cell)
// ============================================================================

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sorting state for sortable columns */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: "asc" | "desc" | null;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0",
        sortable && "cursor-pointer select-none hover:text-foreground",
        className
      )}
      aria-sort={
        sortDirection === "asc"
          ? "ascending"
          : sortDirection === "desc"
          ? "descending"
          : undefined
      }
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-1">
          {children}
          {sortDirection === "asc" && (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          )}
          {sortDirection === "desc" && (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
          {sortDirection === null && sortable && (
            <svg
              className="h-4 w-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          )}
        </div>
      ) : (
        children
      )}
    </th>
  )
);
TableHead.displayName = "TableHead";

// ============================================================================
// Table Cell Component
// ============================================================================

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Whether the cell content should be truncated */
  truncate?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, truncate, children, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-4 align-middle",
        "[&:has([role=checkbox])]:pr-0",
        truncate && "max-w-[200px] truncate",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
TableCell.displayName = "TableCell";

// ============================================================================
// Table Caption Component
// ============================================================================

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
TableCaption.displayName = "TableCaption";

// ============================================================================
// Empty State Component
// ============================================================================

interface TableEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button/link */
  action?: React.ReactNode;
  /** Number of columns for proper colspan */
  colSpan?: number;
}

const TableEmptyState = React.forwardRef<HTMLDivElement, TableEmptyStateProps>(
  (
    {
      className,
      icon,
      title = "No data",
      description = "No items to display",
      action,
      colSpan = 1,
      ...props
    },
    ref
  ) => (
    <tr>
      <td colSpan={colSpan}>
        <div
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center py-12 text-center",
            className
          )}
          {...props}
        >
          {icon && (
            <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="mb-1 text-lg font-semibold">{title}</h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
          {action && <div>{action}</div>}
        </div>
      </td>
    </tr>
  )
);
TableEmptyState.displayName = "TableEmptyState";

// ============================================================================
// Loading State Component
// ============================================================================

interface TableLoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Number of columns for proper colspan */
  colSpan?: number;
}

const TableLoadingState = React.forwardRef<HTMLDivElement, TableLoadingStateProps>(
  ({ rows = 5, columns = 4, ..._props }, _ref) => (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <div
                className={cn(
                  "h-4 rounded bg-muted",
                  colIndex === 0 ? "w-32" : "w-24"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
);
TableLoadingState.displayName = "TableLoadingState";

// ============================================================================
// Exports
// ============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmptyState,
  TableLoadingState,
};

export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
  TableEmptyStateProps,
  TableLoadingStateProps,
};
