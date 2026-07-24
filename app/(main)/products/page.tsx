'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderTree,
  Layers3,
  ListFilter,
  PackageOpen,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSheetData } from '../../hooks/useSheetData';
import PageHero from '../components/PageHero';
import ProductDetailGallery from '../components/ProductDetailGallery';

type ProductRow = {
  id?: number;
  legacyNo?: number | null;
  name?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  description?: string | null;
  hasDiscount?: boolean | string | null;
  discountPrice?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  imageUrl4?: string | null;
  isBestSeller?: boolean | null;
};

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

function formatCurrency(value?: string | number | null, contactLabel = 'Hubungi kami') {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(number)) return value || contactLabel;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function getNumericPrice(value?: number | string | null) {
  return Number(value) || 0;
}

function getDiscountPercent(
  price?: number | string | null,
  discountPrice?: number | string | null,
) {
  const originalPrice = getNumericPrice(price);
  const finalPrice = getNumericPrice(discountPrice);

  if (originalPrice <= 0 || finalPrice <= 0 || finalPrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

function formatSoldCount(value?: number | string | null, soldLabel = 'terjual') {
  const soldCount = Math.max(0, Math.floor(Number(value) || 0));

  if (soldCount >= 1_000_000) {
    const formatted = (soldCount / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');

    return `${formatted}JT+ ${soldLabel}`;
  }

  if (soldCount >= 1_000) {
    const formatted = (soldCount / 1_000).toFixed(1).replace('.0', '').replace('.', ',');

    return `${formatted}RB+ ${soldLabel}`;
  }

  return `${soldCount.toLocaleString('id-ID')} ${soldLabel}`;
}

function isTruthy(value?: boolean | string | null) {
  if (typeof value === 'boolean') return value;

  return ['true', '1', 'yes', 'ya'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );
}

function cleanCategory(value?: string | null, fallback = 'Lainnya') {
  return value?.trim() || fallback;
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

function getProductDetailKey(product: ProductRow) {
  return String(product.id ?? product.legacyNo ?? product.name ?? '');
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

  const products = data.length > 0 ? data : fallbackProducts;
  const [search, setSearch] = useState('');
  const [selectedMain, setSelectedMain] = useState('Semua');
  const [selectedSecond, setSelectedSecond] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [expandedMain, setExpandedMain] = useState<Set<string>>(new Set());
  const [expandedSecond, setExpandedSecond] = useState<Set<string>>(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    const requestedDetailKey = new URLSearchParams(window.location.search).get('detail');

    if (!requestedDetailKey || products.length === 0) return;

    const requestedProduct = products.find(
      (item) => getProductDetailKey(item) === requestedDetailKey,
    );

    if (!requestedProduct) return;

    const frameId = window.requestAnimationFrame(() => {
      setSelected(requestedProduct);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [products]);

  useEffect(() => {
    void refresh();
    void refreshSettings();
  }, [refresh, refreshSettings]);

  const categoryTree = useMemo(() => buildCategoryTree(products), [products]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const main = cleanCategory(product.mainCategory);
      const second = cleanCategory(product.secondCategory);
      const sub = cleanCategory(product.subCategory);
      const mainMatch = selectedMain === 'Semua' || main === selectedMain;
      const secondMatch = !selectedSecond || second === selectedSecond;
      const subMatch = !selectedSub || sub === selectedSub;
      const searchable = [product.name, main, second, sub].filter(Boolean).join(' ').toLowerCase();

      return mainMatch && secondMatch && subMatch && (!keyword || searchable.includes(keyword));
    });
  }, [products, search, selectedMain, selectedSecond, selectedSub]);

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
    selectAll();
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
    getContent,
  };

  return (
    <main>
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

      <section className="section-shell pb-28">
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
              <button
                type="button"
                className="product-mobile-filter-trigger"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <PanelLeftOpen size={18} />

                {getContent('products_filter_button', 'Kategori')}
              </button>

              <div className="product-search">
                <Search size={18} />

                <input
                  type="search"
                  className="site-input"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={getContent(
                    'products_search_placeholder',
                    'Cari nama, kategori, atau tipe produk...',
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCurrentPage(1);
                    }}
                    aria-label={getContent('products_clear_search_label', 'Hapus pencarian')}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-(--text-muted) hover:bg-(--surface-hover)"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <div className="product-toolbar-actions">
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

              {(selectedMain !== 'Semua' || search) && (
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
                    <motion.article
                      layout
                      key={`${product.legacyNo ?? index}-${product.name ?? 'produk'}`}
                      initial={{ opacity: 0, scale: 0.94, y: 24 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 14 }}
                      transition={{
                        duration: 0.42,
                        delay: Math.min(index * 0.045, 0.24),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ y: -9 }}
                      className="site-card product-card product-catalog-card product-card-clickable"
                      role="button"
                      tabIndex={0}
                      aria-label={`Lihat detail ${product.name || 'Produk'}`}
                      onClick={() => setSelected(product)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelected(product);
                        }
                      }}
                    >
                      <div className="product-card-ambient" />
                      <div className="product-image-wrap">
                        <div className="product-card-badges">
                          {isTruthy(product.isBestSeller) && (
                            <span className="site-chip product-badge product-best-badge">
                              {getContent('products_best_seller_badge', 'Terlaris')}
                            </span>
                          )}
                          <span className="site-chip product-badge product-main-badge">
                            {cleanCategory(product.mainCategory)}
                          </span>
                        </div>
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={
                              product.name ||
                              getContent('products_product_image_alt', 'Produk teknik')
                            }
                            fill
                            sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 34vw"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            fetchPriority={index === 0 ? 'high' : 'auto'}
                            className="product-image"
                          />
                        ) : (
                          <div className="product-image-placeholder">
                            <Wrench size={48} strokeWidth={1.2} />
                          </div>
                        )}
                        <span className="product-image-scan" aria-hidden="true" />
                      </div>

                      <div className="product-card-content">
                        <div className="product-category-trail">
                          <span>{cleanCategory(product.mainCategory)}</span>
                          <ChevronRight size={11} />
                          <span>{cleanCategory(product.secondCategory)}</span>
                          <ChevronRight size={11} />
                          <span>{cleanCategory(product.subCategory)}</span>
                        </div>
                        <h2 className="product-card-title">
                          {product.name ||
                            getContent(
                              'products_default_product_name',
                              'Produk Teknik Profesional',
                            )}
                        </h2>
                        <div className="product-card-meta">
                          <span>
                            {getContent('products_card_meta_label', 'Professional equipment')}
                          </span>
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Star size={13} fill="currentColor" /> {product.rating || '5'}
                          </span>
                        </div>
                        <div className="product-price">
                          {isTruthy(product.hasDiscount) &&
                          getNumericPrice(product.discountPrice) > 0 &&
                          getNumericPrice(product.discountPrice) <
                            getNumericPrice(product.price) ? (
                            <div className="mt-1 min-h-20.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <strong className="text-xl font-bold tracking-tight text-red-500">
                                  {formatCurrency(
                                    product.discountPrice,
                                    getContent('products_contact_price_label', 'Hubungi kami'),
                                  )}
                                </strong>

                                <span className="text-xs text-(--text-muted) line-through">
                                  {formatCurrency(
                                    product.price,
                                    getContent('products_contact_price_label', 'Hubungi kami'),
                                  )}
                                </span>

                                <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                                  -{getDiscountPercent(product.price, product.discountPrice)}%
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                                  {getContent(
                                    'products_best_price_guarantee',
                                    'Garansi Harga Terbaik',
                                  )}
                                </span>

                                <span className="text-xs font-medium text-(--text-muted)">
                                  {formatSoldCount(
                                    product.soldCount,
                                    getContent('products_sold_label', 'terjual'),
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 min-h-20.5">
                              <strong className="text-xl font-bold tracking-tight text-(--text-primary)">
                                {formatCurrency(
                                  product.price,
                                  getContent('products_contact_price_label', 'Hubungi kami'),
                                )}
                              </strong>

                              <div className="mt-2">
                                <span className="text-xs font-medium text-(--text-muted)">
                                  {formatSoldCount(
                                    product.soldCount,
                                    getContent('products_sold_label', 'terjual'),
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="product-card-actions product-card-actions-single">
                          <Link
                            href="/contact"
                            className="site-button site-button-primary"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {getContent('products_offer_button', 'Penawaran')}
                          </Link>
                        </div>
                      </div>
                    </motion.article>
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

      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="category-mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setMobileFiltersOpen(false);
            }}
          >
            <motion.aside
              className="category-mobile-drawer"
              initial={{ x: '-102%' }}
              animate={{ x: 0 }}
              exit={{ x: '-102%' }}
              transition={{ type: 'spring', stiffness: 310, damping: 32 }}
            >
              <CategorySidebar {...sidebarProps} onClose={() => setMobileFiltersOpen(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setSelected(null);
            }}
          >
            <motion.div
              className="product-modal"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelected(null)}
                aria-label={getContent('products_close_detail_label', 'Tutup detail')}
              >
                <X size={19} />
              </button>
              <div className="product-modal-image">
                <ProductDetailGallery
                  key={selected.id ?? selected.name ?? 'produk'}
                  name={selected.name || 'Produk Teknik'}
                  imageUrl={selected.imageUrl}
                  imageUrl2={selected.imageUrl2}
                  imageUrl3={selected.imageUrl3}
                  imageUrl4={selected.imageUrl4}
                />
              </div>
              <div className="product-modal-content">
                <span className="site-chip">
                  {selected.mainCategory ||
                    getContent('products_default_category_label', 'Peralatan')}
                </span>
                <h2 className="mt-6 text-3xl font-black tracking-[-0.04em]">{selected.name}</h2>
                <p className="whitespace-pre-line text-(--text-secondary)">
                  {selected.description?.trim() ||
                    getContent(
                      'products_detail_fallback',
                      'Detail produk belum tersedia. Silakan hubungi kami untuk mendapatkan informasi lengkap produk ini.',
                    )}
                </p>
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-[0.7fr_1.3fr]">
                  <div className="site-card p-4">
                    <span className="text-xs text-(--text-muted)">
                      {getContent('products_rating_label', 'Rating Produk')}
                    </span>

                    <strong className="mt-2 flex items-center gap-2 text-lg">
                      <Star size={17} fill="currentColor" className="text-amber-500" />

                      {selected.rating || '5'}
                    </strong>
                  </div>

                  <div className="site-card p-4">
                    <span className="text-xs text-(--text-muted)">
                      {getContent('products_price_label', 'Harga Produk')}
                    </span>

                    {isTruthy(selected.hasDiscount) &&
                    getNumericPrice(selected.discountPrice) > 0 &&
                    getNumericPrice(selected.discountPrice) < getNumericPrice(selected.price) ? (
                      <div className="mt-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <strong className="text-2xl font-bold tracking-tight text-red-500">
                            {formatCurrency(
                              selected.discountPrice,
                              getContent('products_contact_price_label', 'Hubungi kami'),
                            )}
                          </strong>

                          <span className="text-sm text-(--text-muted) line-through">
                            {formatCurrency(
                              selected.price,
                              getContent('products_contact_price_label', 'Hubungi kami'),
                            )}
                          </span>

                          <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs font-bold text-red-500">
                            -{getDiscountPercent(selected.price, selected.discountPrice)}%
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            {getContent('products_best_price_guarantee', 'Garansi Harga Terbaik')}
                          </span>

                          {getNumericPrice(selected.soldCount) > 0 && (
                            <span className="text-xs font-medium text-(--text-muted)">
                              {formatSoldCount(
                                selected.soldCount,
                                getContent('products_sold_label', 'terjual'),
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <strong className="block text-2xl font-bold tracking-tight text-(--text-primary)">
                          {formatCurrency(
                            selected.price,
                            getContent('products_contact_price_label', 'Hubungi kami'),
                          )}
                        </strong>

                        {getNumericPrice(selected.soldCount) > 0 && (
                          <span className="mt-2 block text-xs font-medium text-(--text-muted)">
                            {formatSoldCount(
                              selected.soldCount,
                              getContent('products_sold_label', 'terjual'),
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Link href="/contact" className="site-button site-button-primary mt-7 w-full">
                  {getContent('products_request_offer_button', 'Minta Penawaran')}{' '}
                  <ArrowRight size={17} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
