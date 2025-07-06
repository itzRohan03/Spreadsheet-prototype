import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useMemo, useState, useEffect, type KeyboardEvent } from 'react';

interface RowData {
  id: number;
  name: string;
  value: string;
  status: string; // Added for tab filtering
}

const sampleData: RowData[] = [
  { id: 1, name: 'Item 1', value: '100', status: 'Active' },
  { id: 2, name: 'Item 2', value: '200', status: 'Inactive' },
  { id: 3, name: 'Item 3', value: '300', status: 'Active' },
];

const columns = [
  { header: 'ID', accessorKey: 'id', size: 80 },
  { header: 'Name', accessorKey: 'name', size: 200 },
  { header: 'Value', accessorKey: 'value', size: 150 },
];

const Spreadsheet: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [focusedCell, setFocusedCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    return activeTab === 'all'
      ? sampleData
      : sampleData.filter(row => row.status.toLowerCase() === activeTab);
  }, [activeTab]);

  const table = useReactTable({
    columns: columns.map((col) => ({
      ...col,
      enableResizing: true,
      enableHiding: true,
    })),
    data: filteredData,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnVisibility: Object.fromEntries(hiddenColumns.map(colId => [colId, false])),
    },
    onColumnVisibilityChange: setHiddenColumns,
  });

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    console.log(`Switched to tab: ${tab}`);
  };

  const handleCellClick = (cellValue: string, rowId: number, columnId: string) => {
    console.log(`Clicked cell: Row ${rowId}, Column ${columnId}, Value ${cellValue}`);
    const rowIdx = filteredData.findIndex(row => row.id === rowId);
    const colIdx = columns.findIndex(col => col.accessorKey === columnId);
    setFocusedCell({ rowIdx, colIdx });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!focusedCell) return;

    let { rowIdx, colIdx } = focusedCell;
    switch (e.key) {
      case 'ArrowUp':
        rowIdx = Math.max(0, rowIdx - 1);
        break;
      case 'ArrowDown':
        rowIdx = Math.min(filteredData.length - 1, rowIdx + 1);
        break;
      case 'ArrowLeft':
        colIdx = Math.max(0, colIdx - 1);
        break;
      case 'ArrowRight':
        colIdx = Math.min(columns.length - 1, colIdx + 1);
        break;
      default:
        return;
    }
    setFocusedCell({ rowIdx, colIdx });
    console.log(`Navigated to Row ${rowIdx}, Column ${colIdx}`);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumns(prev =>
      prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
    );
    console.log(`Toggled column ${columnId}: ${!hiddenColumns.includes(columnId)}`);
  };

  const handleResize = (columnId: string, newSize: number) => {
    const column = table.getColumn(columnId);
    if (column) {
      column.getContext().columnDef.size = newSize;
      table.resetColumnSizing();
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Header with Tabs and Column Toggles */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 rounded-t-md font-medium ${
              activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTabClick('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 rounded-t-md font-medium ${
              activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => handleTabClick('active')}
          >
            Active
          </button>
        </div>
        <div className="flex space-x-2">
          {columns.map(col => (
            <button
              key={col.accessorKey}
              className="px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs"
              onClick={() => toggleColumn(col.accessorKey)}
            >
              {col.header} {hiddenColumns.includes(col.accessorKey) ? '👁️' : '🙈'}
            </button>
          ))}
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={() => console.log('Add Row clicked')}
          >
            Add Row
          </button>
          <button
            className="px-4 py-2 bg-gray-600 text-white rounded-md"
            onClick={() => console.log('Export clicked')}
          >
            Export
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="overflow-x-auto border border-gray-300 rounded-md shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((column) => (
                  <th
                    key={column.id}
                    className="border-b border-gray-300 bg-gray-100 p-2 text-left text-sm font-semibold text-gray-800 sticky top-0"
                    style={{ width: column.getSize() || column.columnDef.size }}
                  >
                    {column.column.columnDef.header as string}
                    <div
                      className="w-1 h-4 bg-gray-400 cursor-col-resize inline-block ml-2"
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startSize = column.getSize() || (column.columnDef.size as number);
                        const handleMouseMove = (e: MouseEvent) => {
                          const newSize = Math.max(50, startSize + (e.clientX - startX));
                          handleResize(column.id, newSize);
                        };
                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp, { once: true });
                      }}
                    />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => (
              <tr key={row.id} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.getVisibleCells().map((cell, colIdx) => (
                  <td
                    key={cell.id}
                    className={`border-b border-gray-300 p-2 text-sm text-gray-800 cursor-pointer ${
                      focusedCell?.rowIdx === rowIdx && focusedCell?.colIdx === colIdx
                        ? 'bg-yellow-200'
                        : ''
                    }`}
                    style={{ width: table.getColumn(cell.column.id)?.getSize() }}
                    onClick={() =>
                      handleCellClick(cell.getValue() as string, row.original.id, cell.column.id)
                    }
                  >
                    {cell.getValue() as string}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Spreadsheet;