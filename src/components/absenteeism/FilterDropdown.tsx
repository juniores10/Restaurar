import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';

interface FilterDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function FilterDropdown({ label, icon, options, selected, onChange, placeholder }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  function selectAll() {
    onChange([...filtered]);
  }

  function clearAll() {
    onChange([]);
    setSearch('');
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-left transition-all text-sm ${
          isOpen
            ? 'border-blue-400 ring-2 ring-blue-100 bg-white'
            : selected.length > 0
            ? 'border-blue-300 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <span className="flex-1 truncate">
          {selected.length === 0
            ? <span className="text-gray-400">{placeholder || 'Todos'}</span>
            : selected.length === 1
            ? <span className="text-gray-800">{selected[0]}</span>
            : <span className="text-gray-800">{selected.length} selecionados</span>
          }
        </span>
        {selected.length > 0 && (
          <span className="bg-blue-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[240px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
            <button
              onClick={selectAll}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              Selecionar todos
            </button>
            {selected.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                Nenhum resultado
              </div>
            ) : (
              filtered.map(option => {
                const isSelected = selected.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggle(option)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-800'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
