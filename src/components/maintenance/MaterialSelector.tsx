import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Package, ChevronDown } from 'lucide-react';
import { maintenanceCadastroService, type MaintenanceMaterial } from '../../services/maintenanceCadastroService';

interface SelectedMaterial {
  material: MaintenanceMaterial;
  quantity: number;
}

interface Props {
  value: SelectedMaterial[];
  onChange: (items: SelectedMaterial[]) => void;
}

export function MaterialSelector({ value, onChange }: Props) {
  const [materials, setMaterials] = useState<MaintenanceMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    maintenanceCadastroService.getMaterials().then(setMaterials).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = materials.filter(m => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.warehouse_code?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
    );
  });

  const isSelected = (id: string) => value.some(v => v.material.id === id);

  const addMaterial = (material: MaintenanceMaterial) => {
    if (isSelected(material.id)) return;
    onChange([...value, { material, quantity: 1 }]);
    setSearch('');
  };

  const removeMaterial = (id: string) => {
    onChange(value.filter(v => v.material.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    onChange(value.map(v => v.material.id === id ? { ...v, quantity: Math.max(1, qty) } : v));
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative">
        <div
          className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm cursor-pointer hover:border-emerald-400 transition-colors bg-white"
          onClick={() => setOpen(v => !v)}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar material pelo nome ou codigo..."
            className="flex-1 outline-none bg-transparent text-sm placeholder-gray-400"
            onClick={e => e.stopPropagation()}
          />
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Nenhum material encontrado</div>
            ) : (
              filtered.map(m => {
                const selected = isSelected(m.id);
                const equipment = m.linked_equipment?.[0] ?? m.maintenance_equipment;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={selected}
                    onClick={() => { addMaterial(m); setOpen(false); }}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-emerald-50 transition-colors ${selected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${m.status === 1 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {m.warehouse_code && <span>Alm: {m.warehouse_code} · </span>}
                        {m.unit && <span>Un: {m.unit}</span>}
                        {equipment && <span> · {equipment.name}</span>}
                      </p>
                    </div>
                    {!selected && <Plus className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map(({ material, quantity }) => {
            const equipment = material.linked_equipment?.[0] ?? material.maintenance_equipment;
            return (
              <div
                key={material.id}
                className="flex items-center gap-3 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl"
              >
                <Package className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{material.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {material.warehouse_code && <span>Alm: {material.warehouse_code} · </span>}
                    Un: {material.unit}
                    {equipment && <span> · {equipment.name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(material.id, quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                  >-</button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={e => updateQty(material.id, parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-sm border border-gray-200 rounded-lg py-0.5 outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(material.id, quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                  >+</button>
                  <span className="text-xs text-gray-400 w-5">{material.unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMaterial(material.id)}
                  className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
