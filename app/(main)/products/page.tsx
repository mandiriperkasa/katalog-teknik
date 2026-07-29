'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Layers3,
  ListFilter,
  PackageOpen,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSheetData } from '../../hooks/useSheetData';
import PageHero from '../components/PageHero';
import ProductCard from '../components/ProductCard';
import ProductPromotionSlider, {
  type ProductPromotion,
} from '../components/ProductPromotionSlider';
import { cleanCategory, getNumericPrice, isTruthy, type ProductRow } from './product';

type SettingRow = {
  key: string;
  value?: string | null;
};

type SubCategoryNode = {
  name: string;
  count: number;
};

type SecondCategoryNode = {
  name: string;
  count: number;
  children: SubCategoryNode[];
};

type MainCategoryNode = {
  name: string;
  count: number;
  children: SecondCategoryNode[];
};

type BrandOption = {
  name: string;
  count: number;
};

type ProductSort =
  'newest' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'best-selling' | 'rating';

type CategorySidebarProps = {
  tree: MainCategoryNode[];
  totalCount: number;
  selectedMain: string;
  selectedSecond: string;
  selectedSub: string;
  expandedMain: Set<string>;
  expandedSecond: Set<string>;
  onSelectAll: () => void;
  onSelectMain: (name: string) => void;
  onSelectSecond: (main: string, second: string) => void;
  onSelectSub: (main: string, second: string, sub: string) => void;
  onToggleMain: (name: string) => void;
  onToggleSecond: (main: string, second: string) => void;
  brands: BrandOption[];
  selectedBrand: string;
  onSelectBrand: (name: string) => void;
  minimumPrice: number | null;
  maximumPrice: number | null;
  minimumPriceDraft: string;
  maximumPriceDraft: string;
  onMinimumPriceDraftChange: (value: string) => void;
  onMaximumPriceDraftChange: (value: string) => void;
  onApplyPrice: () => void;
  onClearMinimumPrice: () => void;
  onClearMaximumPrice: () => void;
  onResetPrice: () => void;
  getContent: (key: string, fallback: string) => string;
  onClose?: () => void;
};

const fallbackProducts: ProductRow[] = [
  {
    legacyNo: 1,
    name: 'Blue-point BWA 200 Imaging Wheel Alignment',
    mainCategory: 'Otomotif',
    secondCategory: 'Wheel',
    subCategory: 'Alignment',
    price: '12000000',
    rating: '5',
    isBestSeller: true,
  },
  {
    legacyNo: 2,
    name: 'Blue-point Pyramid2 Imaging Wheel Alignment',
    mainCategory: 'Otomotif',
    secondCategory: 'Wheel',
    subCategory: 'Alignment',
    price: '6000000',
    rating: '5',
  },
  {
    legacyNo: 3,
    name: 'Blue-point Swing-Arm Tire Changer',
    mainCategory: 'Otomotif',
    secondCategory: 'Tire',
    subCategory: 'Changer',
    price: '8500000',
    rating: '5',
    isBestSeller: true,
  },
  {
    legacyNo: 4,
    name: 'Blue-point Two-Post Lift',
    mainCategory: 'Hidraulis',
    secondCategory: 'Lift',
    subCategory: '4 Ton',
    price: '25000000',
    rating: '4',
    isBestSeller: true,
  },
  {
    legacyNo: 5,
    name: 'Blue-point Brake Fluid Changer',
    mainCategory: 'Perlengkapan',
    secondCategory: 'Fluid',
    subCategory: 'Brake',
    price: '3000000',
    rating: '4',
  },
  {
    legacyNo: 6,
    name: 'Blue-point Hydraulic Jack',
    mainCategory: 'Hidraulis',
    secondCategory: 'Jack',
    subCategory: 'Manual',
    price: '888800000',
    rating: '5',
  },
];

const productSortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'best-selling', label: 'Terlaris' },
  { value: 'rating', label: 'Rating Tertinggi' },
];

function getEffectivePrice(product: ProductRow) {
  const originalPrice = getNumericPrice(product.price);
  const discountPrice = getNumericPrice(product.discountPrice);

  if (isTruthy(product.hasDiscount) && discountPrice > 0 && discountPrice < originalPrice) {
    return discountPrice;
  }

  return originalPrice;
}

function formatPriceInput(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  return Number(digits).toLocaleString('id-ID');
}

function getProductBrand(product: ProductRow) {
  return (
    String(product.name ?? '')
      .trim()
      .split(/\s+/)[0]
      ?.replace(/^[^a-z0-9]+|[^a-z0-9-]+$/gi, '') || 'Lainnya'
  );
}

function buildCategoryTree(products: ProductRow[]): MainCategoryNode[] {
  const mainMap = new Map<string, Map<string, Map<string, number>>>();

  products.forEach((product) => {
    const main = cleanCategory(product.mainCategory);
    const second = cleanCategory(product.secondCategory);
    const sub = cleanCategory(product.subCategory);

    if (!mainMap.has(main)) mainMap.set(main, new Map());
    const secondMap = mainMap.get(main)!;
    if (!secondMap.has(second)) secondMap.set(second, new Map());
    const subMap = secondMap.get(second)!;
    subMap.set(sub, (subMap.get(sub) ?? 0) + 1);
  });

  return Array.from(mainMap.entries())
    .map(([mainName, secondMap]) => {
      const children = Array.from(secondMap.entries())
        .map(([secondName, subMap]) => {
          const subChildren = Array.from(subMap.entries())
            .map(([subName, count]) => ({ name: subName, count }))
            .sort((a, b) => a.name.localeCompare(b.name, 'id'));

          return {
            name: secondName,
            count: subChildren.reduce((sum, item) => sum + item.count, 0),
            children: subChildren,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'id'));

      return {
        name: mainName,
        count: children.reduce((sum, item) => sum + item.count, 0),
        children,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

function CategorySidebar({
  tree,
  totalCount,
  selectedMain,
  selectedSecond,
  selectedSub,
  expandedMain,
  expandedSecond,
  onSelectAll,
  onSelectMain,
  onSelectSecond,
  onSelectSub,
  onToggleMain,
  onToggleSecond,
  brands,
  selectedBrand,
  onSelectBrand,
  minimumPrice,
  maximumPrice,
  minimumPriceDraft,
  maximumPriceDraft,
  onMinimumPriceDraftChange,
  onMaximumPriceDraftChange,
  onApplyPrice,
  onClearMinimumPrice,
  onClearMaximumPrice,
  onResetPrice,
  getContent,
  onClose,
}: CategorySidebarProps) {
  const allSelected = selectedMain === 'Semua';

  return (
    <div className="category-panel-inner">
      <div className="category-panel-head">
        <div className="category-panel-icon">
          <FolderTree size={20} />
        </div>
        <div>
          <span className="category-panel-kicker">
            {getContent('products_category_kicker', '3 tingkat navigasi')}
          </span>
          <h2>{getContent('products_category_title', 'Jelajahi Kategori')}</h2>
        </div>
        {onClose && (
          <button
            type="button"
            className="category-panel-close"
            onClick={onClose}
            aria-label={getContent('products_close_category_label', 'Tutup kategori')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <button
        type="button"
        className={`category-all-button ${allSelected ? 'is-active' : ''}`}
        onClick={() => {
          onSelectAll();
          onClose?.();
        }}
      >
        <span className="category-node-icon">
          <Boxes size={17} />
        </span>
        <span className="category-node-copy">
          <strong>{getContent('products_all_products_label', 'Semua Produk')}</strong>
          <small>{getContent('products_complete_catalog_label', 'Katalog lengkap')}</small>
        </span>
        <span className="category-count">{totalCount}</span>
        {allSelected && <Check size={15} className="category-check" />}
      </button>

      <div
        className="category-tree"
        role="tree"
        aria-label={getContent('products_category_tree_label', 'Kategori produk bertingkat')}
      >
        {tree.map((mainNode, mainIndex) => {
          const mainActive = selectedMain === mainNode.name;
          const mainOpen = expandedMain.has(mainNode.name);

          return (
            <motion.div
              key={mainNode.name}
              className="category-main-group"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: mainIndex * 0.045, duration: 0.32 }}
              role="treeitem"
              aria-expanded={mainOpen}
              aria-selected={mainActive}
            >
              <div className={`category-main-row ${mainActive ? 'is-active' : ''}`}>
                <button
                  type="button"
                  className="category-main-select"
                  onClick={() => onSelectMain(mainNode.name)}
                >
                  <span className="category-node-icon">
                    <Layers3 size={17} />
                  </span>
                  <span className="category-node-copy">
                    <strong>{mainNode.name}</strong>
                    <small>
                      {getContent('products_main_category_item_label', 'Kategori utama')}
                    </small>
                  </span>
                  <span className="category-count">{mainNode.count}</span>
                </button>
                <button
                  type="button"
                  className="category-expand-button"
                  onClick={() => onToggleMain(mainNode.name)}
                  aria-label={`${getContent(
                    mainOpen ? 'products_close_label' : 'products_open_label',
                    mainOpen ? 'Tutup' : 'Buka',
                  )} ${getContent('products_category_word', 'kategori')} ${mainNode.name}`}
                >
                  <motion.span
                    animate={{ rotate: mainOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={16} />
                  </motion.span>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {mainOpen && (
                  <motion.div
                    className="category-second-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {mainNode.children.map((secondNode) => {
                      const secondKey = `${mainNode.name}::${secondNode.name}`;
                      const secondActive = mainActive && selectedSecond === secondNode.name;
                      const secondOpen = expandedSecond.has(secondKey);

                      return (
                        <div
                          key={secondKey}
                          className="category-second-group"
                          role="treeitem"
                          aria-expanded={secondOpen}
                          aria-selected={secondActive}
                        >
                          <div className={`category-second-row ${secondActive ? 'is-active' : ''}`}>
                            <button
                              type="button"
                              className="category-second-select"
                              onClick={() => onSelectSecond(mainNode.name, secondNode.name)}
                            >
                              <span className="category-node-dot" />
                              <span className="category-node-copy">
                                <strong>{secondNode.name}</strong>
                                <small>
                                  {getContent(
                                    'products_second_category_item_label',
                                    'Kategori kedua',
                                  )}
                                </small>
                              </span>
                              <span className="category-count">{secondNode.count}</span>
                            </button>
                            <button
                              type="button"
                              className="category-expand-button category-expand-small"
                              onClick={() => onToggleSecond(mainNode.name, secondNode.name)}
                              aria-label={`${getContent(
                                secondOpen ? 'products_close_label' : 'products_open_label',
                                secondOpen ? 'Tutup' : 'Buka',
                              )} ${getContent('products_category_word', 'kategori')} ${secondNode.name}`}
                            >
                              <motion.span
                                animate={{ rotate: secondOpen ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight size={14} />
                              </motion.span>
                            </button>
                          </div>

                          <AnimatePresence initial={false}>
                            {secondOpen && (
                              <motion.div
                                className="category-sub-list"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.24 }}
                              >
                                {secondNode.children.map((subNode) => {
                                  const subActive = secondActive && selectedSub === subNode.name;
                                  return (
                                    <button
                                      type="button"
                                      key={`${secondKey}::${subNode.name}`}
                                      className={`category-sub-button ${subActive ? 'is-active' : ''}`}
                                      onClick={() => {
                                        onSelectSub(mainNode.name, secondNode.name, subNode.name);
                                        onClose?.();
                                      }}
                                    >
                                      <Tag size={13} />
                                      <span>{subNode.name}</span>
                                      <span className="category-count">{subNode.count}</span>
                                      {subActive && <Check size={13} />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="category-brand-filter">
        <div className="category-brand-filter-head">
          <strong>Merek</strong>
          <small>{brands.length} merek tersedia</small>
        </div>

        <div className="category-brand-list">
          <button
            type="button"
            className={selectedBrand === 'Semua' ? 'is-active' : ''}
            onClick={() => onSelectBrand('Semua')}
          >
            <span>Semua Merek</span>
            <span className="category-count">{totalCount}</span>
            {selectedBrand === 'Semua' && <Check size={13} />}
          </button>

          {brands.map((brand) => (
            <button
              type="button"
              key={brand.name}
              className={selectedBrand === brand.name ? 'is-active' : ''}
              onClick={() => onSelectBrand(brand.name)}
            >
              <span>{brand.name}</span>
              <span className="category-count">{brand.count}</span>
              {selectedBrand === brand.name && <Check size={13} />}
            </button>
          ))}
        </div>
      </div>

      <div className="category-price-filter">
        <div className="category-price-filter-head">
          <span>
            <ArrowUpDown size={14} />
          </span>
          <div>
            <strong>Rentang Harga</strong>
            <small>Sesuaikan anggaran produk</small>
          </div>
        </div>

        <div className="category-price-input-grid">
          <label>
            <span>Min</span>
            <div className="category-price-input">
              <small>Rp</small>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatPriceInput(minimumPriceDraft)}
                onChange={(event) =>
                  onMinimumPriceDraftChange(event.target.value.replace(/\D/g, ''))
                }
                aria-label="Harga minimum sidebar"
              />
            </div>
          </label>
          <label>
            <span>Max</span>
            <div className="category-price-input">
              <small>Rp</small>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Max"
                value={formatPriceInput(maximumPriceDraft)}
                onChange={(event) =>
                  onMaximumPriceDraftChange(event.target.value.replace(/\D/g, ''))
                }
                aria-label="Harga maksimum sidebar"
              />
            </div>
          </label>
        </div>

        <button type="button" className="category-price-apply" onClick={onApplyPrice}>
          Terapkan
        </button>

        {(minimumPrice !== null || maximumPrice !== null) && (
          <div className="category-price-active">
            {minimumPrice !== null && (
              <button type="button" onClick={onClearMinimumPrice} aria-label="Hapus harga minimum">
                Min: Rp {minimumPrice.toLocaleString('id-ID')} <X size={11} />
              </button>
            )}
            {maximumPrice !== null && (
              <button type="button" onClick={onClearMaximumPrice} aria-label="Hapus harga maksimum">
                Max: Rp {maximumPrice.toLocaleString('id-ID')} <X size={11} />
              </button>
            )}
            <button type="button" className="category-price-reset" onClick={onResetPrice}>
              Reset harga
            </button>
          </div>
        )}
      </div>

      <div className="category-panel-foot">
        <Sparkles size={15} />
        <span>
          {getContent(
            'products_category_help',
            'Pilih hingga subkategori untuk hasil yang lebih presisi.',
          )}
        </span>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { data, loading, error, refresh } = useSheetData<ProductRow>('Products');

  const { data: settingRows, refresh: refreshSettings } = useSheetData<SettingRow>('Settings');

  const content = useMemo<Record<string, string>>(() => {
    return settingRows.reduce<Record<string, string>>((result, setting) => {
      result[setting.key] = setting.value ?? '';
      return result;
    }, {});
  }, [settingRows]);

  const getContent = (key: string, fallback: string) => {
    return content[key]?.trim() || fallback;
  };

  const products = !loading && !error ? data : data.length > 0 ? data : fallbackProducts;
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [selectedMain, setSelectedMain] = useState('Semua');
  const [selectedSecond, setSelectedSecond] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [expandedMain, setExpandedMain] = useState<Set<string>>(new Set());
  const [expandedSecond, setExpandedSecond] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sort, setSort] = useState<ProductSort>('newest');
  const [selectedBrand, setSelectedBrand] = useState('Semua');
  const [minimumPrice, setMinimumPrice] = useState<number | null>(null);
  const [maximumPrice, setMaximumPrice] = useState<number | null>(null);
  const [minimumPriceDraft, setMinimumPriceDraft] = useState('');
  const [maximumPriceDraft, setMaximumPriceDraft] = useState('');
  const [pricePanelOpen, setPricePanelOpen] = useState(false);
  const [promotions, setPromotions] = useState<ProductPromotion[]>([]);

  useEffect(() => {
    void refresh();
    void refreshSettings();
  }, [refresh, refreshSettings]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPromotions() {
      try {
        const response = await fetch('/api/promotions', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await response.json();

        if (response.ok && Array.isArray(result)) {
          setPromotions(result as ProductPromotion[]);
        }
      } catch (promotionError) {
        if (promotionError instanceof DOMException && promotionError.name === 'AbortError') return;
        console.warn('Promo produk belum dapat dimuat.', promotionError);
      }
    }

    void loadPromotions();
    return () => controller.abort();
  }, []);

  const categoryTree = useMemo(() => buildCategoryTree(products), [products]);
  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((product) => {
      const brand = getProductBrand(product);
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    });

    return Array.from(counts, ([name, count]) => ({ name, count })).sort((left, right) =>
      left.name.localeCompare(right.name, 'id'),
    );
  }, [products]);
  const productBrands = brandOptions.map((brand) => brand.name);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const matches = products.filter((product) => {
      const main = cleanCategory(product.mainCategory);
      const second = cleanCategory(product.secondCategory);
      const sub = cleanCategory(product.subCategory);
      const mainMatch = selectedMain === 'Semua' || main === selectedMain;
      const secondMatch = !selectedSecond || second === selectedSecond;
      const subMatch = !selectedSub || sub === selectedSub;
      const brand = getProductBrand(product);
      const brandMatch = selectedBrand === 'Semua' || brand === selectedBrand;
      const price = getEffectivePrice(product);
      const priceMatch =
        (minimumPrice === null || price >= minimumPrice) &&
        (maximumPrice === null || price <= maximumPrice);
      const searchable = [product.name, brand, main, second, sub]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        mainMatch &&
        secondMatch &&
        subMatch &&
        brandMatch &&
        priceMatch &&
        (!keyword || searchable.includes(keyword))
      );
    });

    return [...matches].sort((left, right) => {
      switch (sort) {
        case 'name-asc':
          return String(left.name ?? '').localeCompare(String(right.name ?? ''), 'id');
        case 'name-desc':
          return String(right.name ?? '').localeCompare(String(left.name ?? ''), 'id');
        case 'price-asc':
          return getEffectivePrice(left) - getEffectivePrice(right);
        case 'price-desc':
          return getEffectivePrice(right) - getEffectivePrice(left);
        case 'best-selling':
          return getNumericPrice(right.soldCount) - getNumericPrice(left.soldCount);
        case 'rating':
          return getNumericPrice(right.rating) - getNumericPrice(left.rating);
        default:
          return (
            getNumericPrice(right.id ?? right.legacyNo) - getNumericPrice(left.id ?? left.legacyNo)
          );
      }
    });
  }, [
    products,
    search,
    selectedMain,
    selectedSecond,
    selectedSub,
    selectedBrand,
    minimumPrice,
    maximumPrice,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safeCurrentPage]);

  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }, [safeCurrentPage, totalPages]);

  const activePath = [
    selectedMain === 'Semua'
      ? getContent('products_all_products_label', 'Semua Produk')
      : selectedMain,
    selectedSecond,
    selectedSub,
    selectedBrand !== 'Semua' ? selectedBrand : '',
  ].filter(Boolean);

  const selectAll = () => {
    setCurrentPage(1);
    setSelectedMain('Semua');
    setSelectedSecond('');
    setSelectedSub('');
  };

  const selectMain = (name: string) => {
    setCurrentPage(1);
    setSelectedMain(name);
    setSelectedSecond('');
    setSelectedSub('');
    setExpandedMain((current) => new Set(current).add(name));
  };

  const selectSecond = (main: string, second: string) => {
    setCurrentPage(1);
    setSelectedMain(main);
    setSelectedSecond(second);
    setSelectedSub('');
    setExpandedMain((current) => new Set(current).add(main));
    setExpandedSecond((current) => new Set(current).add(`${main}::${second}`));
  };

  const selectSub = (main: string, second: string, sub: string) => {
    setCurrentPage(1);
    setSelectedMain(main);
    setSelectedSecond(second);
    setSelectedSub(sub);
    setExpandedMain((current) => new Set(current).add(main));
    setExpandedSecond((current) => new Set(current).add(`${main}::${second}`));
  };

  const toggleMain = (name: string) => {
    setExpandedMain((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSecond = (main: string, second: string) => {
    const key = `${main}::${second}`;
    setExpandedSecond((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setSearchDraft('');
    setSelectedBrand('Semua');
    setMinimumPrice(null);
    setMaximumPrice(null);
    setMinimumPriceDraft('');
    setMaximumPriceDraft('');
    setPricePanelOpen(false);
    selectAll();
  };

  const applyPriceFilter = () => {
    let nextMinimum = minimumPriceDraft ? Number(minimumPriceDraft) : null;
    let nextMaximum = maximumPriceDraft ? Number(maximumPriceDraft) : null;

    if (nextMinimum !== null && nextMaximum !== null && nextMinimum > nextMaximum) {
      [nextMinimum, nextMaximum] = [nextMaximum, nextMinimum];
      setMinimumPriceDraft(String(nextMinimum));
      setMaximumPriceDraft(String(nextMaximum));
    }

    setMinimumPrice(nextMinimum);
    setMaximumPrice(nextMaximum);
    setCurrentPage(1);
    setPricePanelOpen(false);
  };

  const clearMinimumPrice = () => {
    setMinimumPrice(null);
    setMinimumPriceDraft('');
    setCurrentPage(1);
  };

  const clearMaximumPrice = () => {
    setMaximumPrice(null);
    setMaximumPriceDraft('');
    setCurrentPage(1);
  };

  const resetPriceFilter = () => {
    setMinimumPrice(null);
    setMaximumPrice(null);
    setMinimumPriceDraft('');
    setMaximumPriceDraft('');
    setCurrentPage(1);
  };

  const sidebarProps: CategorySidebarProps = {
    tree: categoryTree,
    totalCount: products.length,
    selectedMain,
    selectedSecond,
    selectedSub,
    expandedMain,
    expandedSecond,
    onSelectAll: selectAll,
    onSelectMain: selectMain,
    onSelectSecond: selectSecond,
    onSelectSub: selectSub,
    onToggleMain: toggleMain,
    onToggleSecond: toggleSecond,
    brands: brandOptions,
    selectedBrand,
    onSelectBrand: (name) => {
      setSelectedBrand(name);
      setCurrentPage(1);
    },
    minimumPrice,
    maximumPrice,
    minimumPriceDraft,
    maximumPriceDraft,
    onMinimumPriceDraftChange: setMinimumPriceDraft,
    onMaximumPriceDraftChange: setMaximumPriceDraft,
    onApplyPrice: applyPriceFilter,
    onClearMinimumPrice: clearMinimumPrice,
    onClearMaximumPrice: clearMaximumPrice,
    onResetPrice: resetPriceFilter,
    getContent,
  };

  return (
    <main className="product-listing-page">
      <PageHero
        eyebrow={getContent('products_hero_eyebrow', 'Katalog Produk')}
        title={
          <>
            {getContent('products_hero_title', 'Peralatan yang siap')}{' '}
            <span className="gradient-text">
              {getContent('products_hero_title_highlight', 'bekerja keras.')}
            </span>
          </>
        }
        description={getContent(
          'products_hero_description',
          'Temukan produk teknik sesuai kebutuhan melalui kategori yang tersusun rapi dan mudah dijelajahi.',
        )}
        aside={
          promotions.length > 0 ? <ProductPromotionSlider promotions={promotions} /> : undefined
        }
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="site-chip">
            <Boxes size={14} />
            {products.length} {getContent('products_available_label', 'produk tersedia')}
          </span>

          <span className="site-chip">
            <Layers3 size={14} />
            {categoryTree.length} {getContent('products_main_category_label', 'kategori utama')}
          </span>

          <span className="site-chip">
            <Star size={14} />
            {Math.min(products.length, 10)}{' '}
            {getContent('products_best_seller_label', 'produk terlaris')}
          </span>
        </div>
      </PageHero>

      <section className="section-shell products-catalog-section pb-28">
        <div className="product-mobile-catalog-head">
          <h1>Katalog Produk Lengkap</h1>
          <p>{filtered.length} Barang ditemukan</p>
        </div>

        {promotions.length > 0 && (
          <div className="product-mobile-promotion">
            <ProductPromotionSlider promotions={promotions} />
          </div>
        )}

        <div className="product-catalog-layout">
          <aside
            className="product-category-sidebar site-card"
            data-aos="fade-right"
            data-aos-duration="720"
          >
            <CategorySidebar {...sidebarProps} />
          </aside>

          <div className="product-catalog-content">
            <div className="product-page-toolbar" data-aos="fade-up">
              <form
                className="product-search"
                role="search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(searchDraft.trim());
                  setCurrentPage(1);
                }}
              >
                <Search size={18} />

                <input
                  type="search"
                  className="site-input"
                  aria-label={getContent('products_search_label', 'Cari produk')}
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder={getContent(
                    'products_search_placeholder',
                    'Cari produk atau kode SKU...',
                  )}
                />
                {(searchDraft || search) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setSearchDraft('');
                      setCurrentPage(1);
                    }}
                    aria-label={getContent('products_clear_search_label', 'Hapus pencarian')}
                    className="product-search-clear absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-(--text-muted) hover:bg-(--surface-hover)"
                  >
                    <X size={17} />
                  </button>
                )}
                <button type="submit" className="product-search-submit">
                  Cari
                </button>
              </form>

              <div className="product-mobile-controls">
                <label className="product-mobile-facet">
                  <span className="sr-only">Pilih kategori</span>
                  <select
                    value={selectedMain}
                    onChange={(event) => {
                      if (event.target.value === 'Semua') selectAll();
                      else selectMain(event.target.value);
                    }}
                    aria-label="Pilih kategori"
                  >
                    <option value="Semua">Kategori</option>
                    {categoryTree.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="product-mobile-facet">
                  <span className="sr-only">Pilih merek</span>
                  <select
                    value={selectedBrand}
                    onChange={(event) => {
                      setSelectedBrand(event.target.value);
                      setCurrentPage(1);
                    }}
                    aria-label="Pilih merek"
                  >
                    <option value="Semua">Merek</option>
                    {productBrands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className={`product-mobile-facet product-price-trigger ${
                    minimumPrice !== null || maximumPrice !== null ? 'is-active' : ''
                  }`}
                  aria-expanded={pricePanelOpen}
                  onClick={() => setPricePanelOpen((current) => !current)}
                >
                  <span>
                    {minimumPrice !== null || maximumPrice !== null ? 'Harga...' : 'Harga'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={pricePanelOpen ? 'rotate-180' : ''}
                    aria-hidden="true"
                  />
                </button>

                <label className="product-mobile-facet">
                  <span className="sr-only">Urutkan produk</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as ProductSort);
                      setCurrentPage(1);
                    }}
                    aria-label="Urutkan produk"
                  >
                    {productSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {pricePanelOpen && (
                <div className="product-mobile-price-panel">
                  <div className="product-price-input-grid">
                    <label>
                      <span>Min</span>
                      <div className="product-price-input">
                        <small>Rp</small>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={formatPriceInput(minimumPriceDraft)}
                          onChange={(event) =>
                            setMinimumPriceDraft(event.target.value.replace(/\D/g, ''))
                          }
                          aria-label="Harga minimum"
                        />
                      </div>
                    </label>

                    <label>
                      <span>Max</span>
                      <div className="product-price-input">
                        <small>Rp</small>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Max"
                          value={formatPriceInput(maximumPriceDraft)}
                          onChange={(event) =>
                            setMaximumPriceDraft(event.target.value.replace(/\D/g, ''))
                          }
                          aria-label="Harga maksimum"
                        />
                      </div>
                    </label>
                  </div>

                  <button type="button" className="product-price-apply" onClick={applyPriceFilter}>
                    Terapkan
                  </button>
                </div>
              )}

              {(minimumPrice !== null || maximumPrice !== null) && (
                <div className="product-mobile-active-filters">
                  {minimumPrice !== null && (
                    <button
                      type="button"
                      className="product-price-filter-chip"
                      onClick={clearMinimumPrice}
                      aria-label="Hapus harga minimum"
                    >
                      Min: Rp {minimumPrice.toLocaleString('id-ID')} <X size={12} />
                    </button>
                  )}

                  {maximumPrice !== null && (
                    <button
                      type="button"
                      className="product-price-filter-chip"
                      onClick={clearMaximumPrice}
                      aria-label="Hapus harga maksimum"
                    >
                      Max: Rp {maximumPrice.toLocaleString('id-ID')} <X size={12} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="product-price-filter-reset"
                    onClick={resetPriceFilter}
                  >
                    Reset Filter
                  </button>
                </div>
              )}

              <div className="product-toolbar-actions">
                <label className="product-sort product-sort-desktop">
                  <ArrowUpDown size={15} />
                  <span>{getContent('products_sort_label', 'Urutkan')}</span>
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value as ProductSort);
                      setCurrentPage(1);
                    }}
                    aria-label="Urutkan produk"
                  >
                    {productSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="product-page-size">
                  <span>{getContent('products_show_label', 'Tampilkan')}</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label={getContent('products_page_size_label', 'Jumlah produk per halaman')}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </label>
                <div className="result-count">
                  <ListFilter size={14} />
                  {filtered.length} {getContent('products_results_label', 'hasil')}
                </div>
              </div>
            </div>

            <div className="product-active-path" data-aos="fade-up" data-aos-delay="80">
              <div className="product-active-path-copy">
                <span className="product-active-label">
                  {getContent('products_active_selection_label', 'Pilihan aktif')}
                </span>
                <div className="product-breadcrumbs">
                  {activePath.map((item, index) => (
                    <span key={`${item}-${index}`}>
                      {index > 0 && <ChevronRight size={13} />}
                      <strong>{item}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {(selectedMain !== 'Semua' ||
                selectedBrand !== 'Semua' ||
                minimumPrice !== null ||
                maximumPrice !== null ||
                search) && (
                <button type="button" className="product-reset-button" onClick={resetFilters}>
                  <RotateCcw size={14} />

                  {getContent('products_reset_label', 'Reset')}
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-(--danger)/20 p-4 text-sm text-(--danger)">
                {getContent(
                  'products_load_error',
                  'Data online belum dapat dimuat. Silakan coba kembali.',
                )}
              </div>
            )}

            {loading && data.length === 0 ? (
              <div className="product-grid product-catalog-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="site-card min-h-107.5 animate-pulse bg-(--surface-soft)"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="site-card empty-state" data-aos="zoom-in">
                <div className="empty-state-icon">
                  <PackageOpen size={27} />
                </div>
                <h2 className="text-xl font-bold">
                  {getContent('products_empty_title', 'Produk tidak ditemukan')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                  {getContent(
                    'products_empty_description',
                    'Tidak ada produk pada kombinasi kategori atau kata kunci tersebut. Coba pilih tingkat kategori lain.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="site-button site-button-secondary"
                >
                  <RotateCcw size={16} />

                  {getContent('products_reset_label', 'Reset')}
                </button>
              </div>
            ) : (
              <motion.div layout className="product-grid product-catalog-grid">
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((product, index) => (
                    <ProductCard
                      key={`${product.legacyNo ?? index}-${product.name ?? 'produk'}`}
                      product={product}
                      index={index}
                      content={content}
                      eagerImage={index === 0}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {!loading && filtered.length > 0 && totalPages > 1 && (
              <nav
                className="product-pagination"
                aria-label={getContent('products_pagination_label', 'Navigasi halaman produk')}
                data-aos="fade-up"
              >
                <button
                  type="button"
                  className="product-page-button product-page-arrow"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                  aria-label={getContent('products_previous_page_label', 'Halaman sebelumnya')}
                >
                  <ChevronLeft size={16} />
                </button>

                {visiblePageNumbers[0] > 1 && (
                  <>
                    <button
                      type="button"
                      className="product-page-button"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                    {visiblePageNumbers[0] > 2 && <span className="product-page-ellipsis">…</span>}
                  </>
                )}

                {visiblePageNumbers.map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={`product-page-button ${safeCurrentPage === page ? 'is-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={safeCurrentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                {visiblePageNumbers.at(-1)! < totalPages && (
                  <>
                    {visiblePageNumbers.at(-1)! < totalPages - 1 && (
                      <span className="product-page-ellipsis">…</span>
                    )}
                    <button
                      type="button"
                      className="product-page-button"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="product-page-button product-page-arrow"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                  aria-label={getContent('products_next_page_label', 'Halaman berikutnya')}
                >
                  <ChevronRight size={16} />
                </button>

                <span className="product-page-summary">
                  {(safeCurrentPage - 1) * pageSize + 1}–
                  {Math.min(safeCurrentPage * pageSize, filtered.length)}{' '}
                  {getContent('products_pagination_of_label', 'dari')} {filtered.length}
                </span>
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
