import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { useShoppingCart } from '@/hooks/use-shopping-cart';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/lib/utils';
import { getUpsellProducts, calculateAccessoryQuantity } from '@/lib/products';
import { getVendorProductById } from '@/lib/harbinger/sync';
import SquareFootageCalculator from '@/components/SquareFootageCalculator';
import ProjectAccessoriesCalculator from '@/components/ProjectAccessoriesCalculator';
import marketingData from '@/data/vendor_product_marketing.json';

import products from '../../products';

const formatSpecLabel = (label) => {
  if (!label) return '';
  return String(label)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const parseJsonMaybe = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const shouldSkipSpecEntry = (label, value) => {
  const labelText = String(label || '').toLowerCase();
  if (labelText.includes('url')) return true;
  if (typeof value === 'string' && value.trim().toLowerCase().startsWith('http')) return true;
  return false;
};

const dedupeEntries = (entries) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.label}::${entry.value ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeSpecLabel = (label) => {
  const text = formatSpecLabel(label).toLowerCase();
  const map = {
    'edge type': 'edge',
    edge: 'edge',
    texture: 'texture',
    textures: 'texture',
    'thickness mm': 'thickness',
    thickness: 'thickness',
    'wear layer mm': 'wear layer',
    'wear layer': 'wear layer',
    'plank width in': 'plank width',
    'plank width': 'plank width',
    'plank length in': 'plank length',
    'plank length': 'plank length',
  };
  return map[text] || text;
};

const normalizeSpecValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
};

const dedupeByNormalizedLabel = (entries) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const normalizedLabel = normalizeSpecLabel(entry.label);
    const normalizedValue = normalizeSpecValue(entry.value);
    const key = `${normalizedLabel}::${normalizedValue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildSpecEntries = (specs) => {
  const parsed = parseJsonMaybe(specs);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    const entries = [];
    parsed.forEach((item) => {
      if (!item) return;
      if (typeof item === 'string') {
        if (shouldSkipSpecEntry(item, '')) return;
        entries.push({ label: formatSpecLabel(item), value: '' });
        return;
      }
      if (typeof item === 'object') {
        if ('label' in item && 'value' in item) {
          if (shouldSkipSpecEntry(item.label, item.value)) return;
          entries.push({ label: formatSpecLabel(item.label), value: item.value });
          return;
        }
        if ('name' in item && 'value' in item) {
          if (shouldSkipSpecEntry(item.name, item.value)) return;
          entries.push({ label: formatSpecLabel(item.name), value: item.value });
          return;
        }
        Object.entries(item).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') return;
          if (shouldSkipSpecEntry(key, value)) return;
          entries.push({ label: formatSpecLabel(key), value });
        });
      }
    });
    return dedupeByNormalizedLabel(dedupeEntries(entries));
  }

  if (typeof parsed === 'object') {
    const entries = Object.entries(parsed)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '' && !shouldSkipSpecEntry(key, value))
      .map(([key, value]) => ({
        label: formatSpecLabel(key),
        value,
      }));
    return dedupeByNormalizedLabel(dedupeEntries(entries));
  }

  if (typeof parsed === 'string') {
    if (shouldSkipSpecEntry(parsed, '')) return [];
    return dedupeByNormalizedLabel(dedupeEntries([{ label: formatSpecLabel(parsed), value: '' }]));
  }

  return [];
};

const buildSpecSections = (specs) => {
  const parsed = parseJsonMaybe(specs);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    const sections = [];
    parsed.forEach((item) => {
      if (!item) return;
      if (typeof item === 'object' && !Array.isArray(item)) {
        const sectionTitle = item.section || item.title || item.group || item.category;
        const sectionItems = item.items || item.specs || item.entries;
        if (sectionTitle && sectionItems) {
          const entries = buildSpecEntries(sectionItems);
          if (entries.length > 0) {
            sections.push({ title: formatSpecLabel(sectionTitle), entries });
          }
          return;
        }
      }
    });

    if (sections.length > 0) return sections;

    const entries = buildSpecEntries(parsed);
    return entries.length > 0 ? [{ title: 'Specifications', entries }] : [];
  }

  if (typeof parsed === 'object') {
    const sections = [];
    const defaultEntries = [];

    Object.entries(parsed).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return;
      if (shouldSkipSpecEntry(key, value)) return;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const entries = buildSpecEntries(value);
        if (entries.length > 0) {
          sections.push({ title: formatSpecLabel(key), entries });
        }
        return;
      }

      if (Array.isArray(value)) {
        const entries = buildSpecEntries(value);
        if (entries.length > 0) {
          sections.push({ title: formatSpecLabel(key), entries });
        }
        return;
      }

      defaultEntries.push({ label: formatSpecLabel(key), value });
    });

    if (defaultEntries.length > 0) {
      sections.unshift({ title: 'Specifications', entries: dedupeByNormalizedLabel(dedupeEntries(defaultEntries)) });
    }

    return sections;
  }

  if (typeof parsed === 'string') {
    const entries = buildSpecEntries(parsed);
    return entries.length > 0 ? [{ title: 'Specifications', entries }] : [];
  }

  return [];
};

const buildFeatureList = (features) => {
  const parsed = parseJsonMaybe(features);
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    const items = [];
    parsed.forEach((item) => {
      if (!item) return;
      if (typeof item === 'string') {
        if (shouldSkipSpecEntry(item, '')) return;
        items.push(item);
        return;
      }
      if (typeof item === 'object') {
        Object.entries(item).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') return;
          if (shouldSkipSpecEntry(key, value)) return;
          items.push(`${formatSpecLabel(key)}: ${value}`);
        });
      }
    });
    return Array.from(new Set(items));
  }

  if (typeof parsed === 'object') {
    return Array.from(new Set(Object.entries(parsed)
      .filter(([key, value]) => value !== null && value !== undefined && value !== '' && !shouldSkipSpecEntry(key, value))
      .map(([key, value]) => `${formatSpecLabel(key)}: ${value}`)));
  }

  if (typeof parsed === 'string') {
    if (shouldSkipSpecEntry(parsed, '')) return [];
    return [parsed];
  }

  return [];
};

const looksLikeSpecLine = (value, sku) => {
  if (!value) return false;
  const text = String(value).toLowerCase();
  if (sku && text.includes(String(sku).toLowerCase())) return true;
  if (text.includes('x') && (text.includes('mm') || text.includes('wl'))) return true;
  return false;
};

const SERIES_FALLBACK = {
  Contract:
    'Commercial-grade glue-down vinyl built for high-traffic installs with a durable core and Harbinger 4S coating.',
  Craftsman:
    'Balanced design and durability in a glue-down format with realistic textures and Harbinger 4S protection.',
  Essentials:
    'Versatile neutrals with straightforward glue-down performance and 4S coating for everyday durability.',
  'Signature Acoustic Click':
    'Quiet comfort with a floating install and cork backing, finished with realistic embossing.',
  'Harbinger Acoustic Click':
    'Composite core and cork backing for quieter rooms, with durable 4S protection.',
  'The Quiet Zone':
    'IXPE acoustic layer paired with glue-down performance and durable 4S protection.',
};

const Product = props => {
  const router = useRouter();
  const { cartCount, addItem } = useShoppingCart();
  const [sqFt, setSqFt] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const upsellProducts = getUpsellProducts(props.id);
  const showDescription = Boolean(props.description);
  const fallbackDescription = SERIES_FALLBACK[props.collection] || SERIES_FALLBACK[props.series];
  const marketingDescription = marketingData?.[props.slug]?.description || marketingData?.[props.id]?.description || null;
  const safeDescription = looksLikeSpecLine(props.description, props.sku) ? null : props.description;
  const displayDescription = marketingDescription || safeDescription || fallbackDescription || null;
  const metaDescription = displayDescription || 'Beautiful floors, amazing prices.';

  const productImages = useMemo(() => {
    if (props.images && props.images.length > 0) {
      return props.images.map(image => image.url);
    }
    return props.image ? [props.image] : [];
  }, [props.images, props.image]);

  const imagesForViewer = useMemo(() => {
    return productImages.length > 0 ? productImages : ['/flooring/placeholder.jpg'];
  }, [productImages]);

  const activeImage = selectedImage || props.image || '/flooring/placeholder.jpg';

  const vendorSpecSections = useMemo(() => {
    const sections = buildSpecSections(props.specs);
    if (props.warranty) {
      sections.push({
        title: 'Warranty',
        entries: [{ label: 'Warranty', value: props.warranty }],
      });
    }
    return sections;
  }, [props.specs, props.warranty]);

  const vendorFeatureItems = useMemo(() => buildFeatureList(props.features), [props.features]);

  const overviewBullets = useMemo(() => {
    if (vendorFeatureItems.length > 0) return vendorFeatureItems;
    if (Array.isArray(props.highlights) && props.highlights.length > 0) return props.highlights;
    return [];
  }, [vendorFeatureItems, props.highlights]);

  const legacySpecSections = useMemo(() => {
    const dimensionEntries = [];
    const detailEntries = [];

    if (props.dimensionsIn) {
      dimensionEntries.push({
        label: 'Dimensions',
        value: `${props.dimensionsIn.width}" x ${props.dimensionsIn.length}"`,
      });
    }
    if (props.thicknessMm) {
      dimensionEntries.push({ label: 'Thickness', value: `${props.thicknessMm} mm` });
    }
    if (props.wearLayerMil || props.wearLayerMm) {
      const wearLayerValue = props.wearLayerMil
        ? `${props.wearLayerMil} mil`
        : `${props.wearLayerMm} mm`;
      dimensionEntries.push({ label: 'Wear Layer', value: wearLayerValue });
    }

    if (props.installation) {
      detailEntries.push({ label: 'Installation', value: props.installation });
    }
    if (props.edge) {
      detailEntries.push({ label: 'Edge', value: props.edge });
    }
    if (props.construction) {
      detailEntries.push({ label: 'Construction', value: props.construction });
    }
    if (props.texture) {
      detailEntries.push({ label: 'Texture', value: props.texture });
    }
    if (props.waterproof !== undefined) {
      detailEntries.push({ label: 'Waterproof', value: props.waterproof ? 'Yes' : 'No' });
    }
    if (props.radiantHeatCompatible !== undefined) {
      detailEntries.push({
        label: 'Radiant Heat Compatible',
        value: props.radiantHeatCompatible ? 'Yes' : 'No',
      });
    }
    if (props.warrantyResidential || props.warrantyCommercial) {
      detailEntries.push({
        label: 'Warranty',
        value: props.warrantyResidential && props.warrantyCommercial
          ? `${props.warrantyResidential} / ${props.warrantyCommercial}`
          : props.warrantyResidential || props.warrantyCommercial,
      });
    }

    const sections = [];
    if (dimensionEntries.length > 0) {
      sections.push({ title: 'Dimensions', entries: dimensionEntries });
    }
    if (detailEntries.length > 0) {
      sections.push({ title: 'Details', entries: detailEntries });
    }
    return sections;
  }, [
    props.dimensionsIn,
    props.thicknessMm,
    props.wearLayerMil,
    props.wearLayerMm,
    props.installation,
    props.edge,
    props.construction,
    props.texture,
    props.waterproof,
    props.radiantHeatCompatible,
    props.warrantyResidential,
    props.warrantyCommercial,
  ]);

  const allSpecSections = useMemo(() => {
    return [...legacySpecSections, ...vendorSpecSections];
  }, [legacySpecSections, vendorSpecSections]);

  const toastId = useRef();
  const firstRun = useRef(true);

  const handlePrevImage = () => {
    setViewerIndex((prev) => {
      const nextIndex = (prev - 1 + imagesForViewer.length) % imagesForViewer.length;
      setSelectedImage(imagesForViewer[nextIndex]);
      return nextIndex;
    });
  };

  const handleNextImage = () => {
    setViewerIndex((prev) => {
      const nextIndex = (prev + 1) % imagesForViewer.length;
      setSelectedImage(imagesForViewer[nextIndex]);
      return nextIndex;
    });
  };

  const handleOpenViewer = () => {
    const startIndex = imagesForViewer.findIndex((imageUrl) => imageUrl === activeImage);
    const nextIndex = startIndex >= 0 ? startIndex : 0;
    setViewerIndex(nextIndex);
    setSelectedImage(imagesForViewer[nextIndex]);
    setIsViewerOpen(true);
  };

  useEffect(() => {
    if (!isViewerOpen) {
      document.body.style.overflow = 'unset';
      return;
    }
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsViewerOpen(false);
      }
      if (event.key === 'ArrowLeft') {
        setViewerIndex((prev) => {
          const nextIndex = (prev - 1 + imagesForViewer.length) % imagesForViewer.length;
          setSelectedImage(imagesForViewer[nextIndex]);
          return nextIndex;
        });
      }
      if (event.key === 'ArrowRight') {
        setViewerIndex((prev) => {
          const nextIndex = (prev + 1) % imagesForViewer.length;
          setSelectedImage(imagesForViewer[nextIndex]);
          return nextIndex;
        });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isViewerOpen, imagesForViewer.length]);

  // Determine if this is an accessory (simple quantity) or flooring (square footage)
  const isAccessory = props.type === 'Accessory';
  const hasKeySpecs = Boolean(
    props.dimensionsIn ||
    props.thicknessMm ||
    props.wearLayerMm ||
    props.wearLayerMil ||
    props.edge ||
    props.construction ||
    props.installation ||
    props.coverageSqFtPerBox ||
    props.waterproof !== undefined ||
    props.radiantHeatCompatible !== undefined ||
    props.texture ||
    props.warrantyResidential ||
    props.warrantyCommercial
  );
  const showWarrantyLink = Boolean(
    (props.brand && String(props.brand).toLowerCase().includes('harbinger')) ||
    props.warranty ||
    props.warrantyResidential ||
    props.warrantyCommercial
  );
  const showHarbingerNosingInfo = !isAccessory && Boolean(
    props.brand && String(props.brand).toLowerCase().includes('harbinger')
  );
  const warrantyPdfHref = '/resources/harbinger-warranty-guideline.pdf';

  // Calculate boxes needed for internal calculations (if needed)
  const boxesNeeded = props.coverageSqFtPerBox && sqFt > 0
    ? Math.ceil(sqFt / props.coverageSqFtPerBox)
    : 1;

  // Calculate price per sq ft - use pricePerSqFt if available, otherwise calculate from price and coverage
  const pricePerSqFt = props.pricePerSqFt
    ? props.pricePerSqFt
    : props.coverageSqFtPerBox
    ? (props.price / 100) / props.coverageSqFtPerBox
    : 0;

  // Calculate total price based on square footage or quantity
  const totalPrice = isAccessory
    ? (props.price / 100) * quantity
    : pricePerSqFt * sqFt;

  // Calculate compare at price per sq ft
  const compareAtPricePerSqFt = props.compareAtPricePerSqFt
    ? props.compareAtPricePerSqFt
    : props.compareAtPrice && props.coverageSqFtPerBox
    ? (props.compareAtPrice / 100) / props.coverageSqFtPerBox
    : 0;

  const savingsPercent = compareAtPricePerSqFt > 0 && pricePerSqFt > 0
    ? Math.round(((compareAtPricePerSqFt - pricePerSqFt) / compareAtPricePerSqFt) * 100)
    : 0;

  const handleOnAddToCart = () => {
    setAdding(true);
    if (isAccessory) {
      toastId.current = toast.loading(
        `Adding ${quantity} ${quantity === 1 ? 'item' : 'items'}...`
      );
      addItem(props, quantity);
    } else {
      toastId.current = toast.loading(
        `Adding ${sqFt} sq ft...`
      );
      addItem(props, sqFt);
    }
  };

  const handleAddUpsell = (upsellProduct) => {
    // Calculate recommended quantity for accessories with coverage data
    let quantityToAdd = 1;
    if (upsellProduct.coverage && !isAccessory && sqFt > 0) {
      quantityToAdd = calculateAccessoryQuantity(sqFt, upsellProduct);
    }

    addItem(upsellProduct, quantityToAdd);
    setShowGoToCart(true);
    toast.success(`${quantityToAdd} ${upsellProduct.name} added to cart`);
  };

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    setAdding(false);
    setShowGoToCart(true);
    if (isAccessory) {
      toast.success(`${quantity} ${quantity === 1 ? 'item' : 'items'} of ${props.name} added`, {
        id: toastId.current,
      });
    } else {
      toast.success(`${sqFt} sq ft of ${props.name} added`, {
        id: toastId.current,
      });
    }
  }, [cartCount]);

  useEffect(() => {
    if (productImages.length === 0) {
      setSelectedImage(null);
      return;
    }
    if (!selectedImage || !productImages.includes(selectedImage)) {
      setSelectedImage(productImages[0]);
    }
  }, [productImages, selectedImage, props.id]);

  return router.isFallback ? (
    <>
      <Head>
        <title>Loading...</title>
      </Head>
      <div className="min-h-screen bg-vfo-sand flex items-center justify-center">
        <p className="text-center text-lg text-vfo-grey">Loading...</p>
      </div>
    </>
  ) : (
    <>
      <Head>
        <title>{props.name} | Victoria Flooring Outlet</title>
        <meta name="description" content={`${metaDescription} Free shipping on orders over 500 sq ft across Vancouver Island including Victoria, Nanaimo, and Comox Valley.`} />
        <link rel="canonical" href={`https://victoriaflooringoutlet.ca/products/${props.id}`} />

        {/* Product-specific Open Graph overrides */}
        <meta property="og:title" content={`${props.name} | Victoria Flooring Outlet`} />
        <meta property="og:description" content={`${metaDescription} ${props.warranty || ''} Free shipping on orders over 500 sq ft across Vancouver Island.`} />
        <meta property="og:image" content={`https://victoriaflooringoutlet.ca${props.image}`} />
        <meta property="og:url" content={`https://victoriaflooringoutlet.ca/products/${props.id}`} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={pricePerSqFt.toFixed(2)} />
        <meta property="product:price:currency" content="CAD" />

        {/* Product Schema.org markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Product',
              name: props.name,
              image: `https://victoriaflooringoutlet.ca${props.image}`,
              description: metaDescription,
              sku: props.sku || props.id,
              identifier: props.sku || props.id,
              brand: {
                '@type': 'Brand',
                name: props.brand || 'Victoria Flooring Outlet',
              },
              offers: {
                '@type': 'Offer',
                url: `https://victoriaflooringoutlet.ca/products/${props.id}`,
                priceCurrency: 'CAD',
                price: pricePerSqFt.toFixed(2),
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: pricePerSqFt.toFixed(2),
                  priceCurrency: 'CAD',
                  unitText: 'square foot',
                },
                availability: 'https://schema.org/InStock',
                seller: {
                  '@type': 'Organization',
                  name: 'Victoria Flooring Outlet',
                },
              },
              ...(props.rating && {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: props.rating.rate,
                  reviewCount: props.rating.count,
                },
              }),
            }),
          }}
        />

        {/* BreadcrumbList Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://victoriaflooringoutlet.ca'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: props.type === 'Accessory' ? 'Accessories' : 'Flooring',
                  item: props.type === 'Accessory'
                    ? 'https://victoriaflooringoutlet.ca/accessories'
                    : 'https://victoriaflooringoutlet.ca'
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: props.name,
                  item: `https://victoriaflooringoutlet.ca/products/${props.id}`
                }
              ]
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen bg-vfo-sand">
        {isViewerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setIsViewerOpen(false)}
              aria-label="Close image viewer"
            />
            <div className="relative z-10 w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4 text-white">
                <p className="text-sm uppercase tracking-[0.2em]">
                  Image {viewerIndex + 1} of {imagesForViewer.length}
                </p>
                <button
                  type="button"
                  onClick={() => setIsViewerOpen(false)}
                  className="px-3 py-1 rounded-full border border-white/40 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="relative w-full h-[70vh] bg-white rounded-2xl overflow-hidden flex items-center justify-center">
                {imagesForViewer.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="View previous image"
                  >
                    ‹
                  </button>
                )}
                <Image
                  src={imagesForViewer[viewerIndex]}
                  alt={`${props.name} image ${viewerIndex + 1}`}
                  fill
                  className="object-contain"
                />
                {imagesForViewer.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
                    aria-label="View next image"
                  >
                    ›
                  </button>
                )}
              </div>
              {imagesForViewer.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {imagesForViewer.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => {
                        setViewerIndex(index);
                        setSelectedImage(imagesForViewer[index]);
                      }}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        index === viewerIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          {/* Breadcrumb */}
          <Link href="/" className="text-sm text-vfo-grey hover:text-vfo-charcoal mb-6 inline-block">
            ← Back
          </Link>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              <button
                type="button"
                className="relative w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-xl bg-white"
                onClick={handleOpenViewer}
                aria-label="Open image viewer"
              >
                <Image
                  src={activeImage}
                  alt={props.name}
                  fill
                  className={props.type === 'Accessory' ? 'object-contain p-8' : 'object-cover'}
                />
                {props.isWeeklyDeal && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 rounded-full">
                    <span className="text-xs font-medium uppercase tracking-[0.25em] text-vfo-grey">This Week's Deal</span>
                  </div>
                )}
              </button>
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto">
                  {productImages.map((imageUrl, index) => (
                    <button
                      key={`${imageUrl}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`relative h-20 w-24 flex-shrink-0 rounded-lg border ${
                        selectedImage === imageUrl ? 'border-vfo-charcoal' : 'border-vfo-border'
                      }`}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <Image
                        src={imageUrl}
                        alt={`${props.name} thumbnail ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-5">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading tracking-wide text-vfo-charcoal mb-2 leading-tight">
                  {props.name}
                </h1>
                {props.brand && !props.name?.toLowerCase().includes(props.brand.toLowerCase()) && (
                  <p className="text-[15px] font-light text-vfo-grey mb-2">Brand: {props.brand}</p>
                )}
                {displayDescription && (
                  <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                    {displayDescription}
                  </p>
                )}
              </div>

              {(overviewBullets.length > 0) && (
                <div className="space-y-3">
                  <h2 className="text-lg font-heading tracking-wide text-vfo-charcoal">Overview</h2>
                  {props.appearanceNote && (
                    <p className="text-sm text-vfo-bluegrey">
                      {props.appearanceNote}
                    </p>
                  )}
                  {overviewBullets.length > 0 && (
                    <ul className="list-disc pl-5 space-y-2 text-[15px] font-light text-vfo-grey">
                      {overviewBullets.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {showWarrantyLink && (
                <div className="bg-white border border-vfo-border rounded-lg px-4 py-3 text-sm text-vfo-charcoal">
                  <span className="text-vfo-grey">Warranty:</span>
                  <a
                    href={warrantyPdfHref}
                    className="ml-2 font-medium text-vfo-accent hover:text-teal-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Harbinger Warranty Guideline (PDF)
                  </a>
                </div>
              )}

              {/* Square Footage Calculator or Simple Quantity Selector */}
              {isAccessory ? (
                <div className="bg-white border border-vfo-border rounded-lg p-6 space-y-4">
                  <div>
                    <label htmlFor="quantity-input" className="block text-sm font-medium text-vfo-charcoal mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        id="quantity-input"
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-24 px-4 py-2 border border-vfo-border rounded-md text-2xl font-medium text-vfo-charcoal focus:outline-none focus:ring-2 focus:ring-vfo-charcoal focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="border-t border-vfo-border pt-4 space-y-2">
                    {props.priceOnRequest ? (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-light text-vfo-grey">Price</span>
                        <span className="text-sm font-light text-vfo-charcoal">
                          {props.priceNote || 'Call for price'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-light text-vfo-grey">Unit Price</span>
                          <span className="text-sm font-light text-vfo-charcoal">{formatCurrency(props.price)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-base font-medium text-vfo-charcoal">Total Price</span>
                          <span className="text-xl font-medium text-vfo-charcoal">{formatCurrency(totalPrice * 100)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {props.coverageSqFtPerBox && (
                    <div className="bg-white border border-vfo-border rounded-lg px-4 py-3 text-sm text-vfo-charcoal">
                      <span className="text-vfo-grey">Coverage per box:</span>
                      <span className="ml-2 font-medium">{props.coverageSqFtPerBox} sq ft</span>
                    </div>
                  )}
                  <SquareFootageCalculator
                    coverageSqFtPerBox={props.coverageSqFtPerBox}
                    pricePerSqFt={pricePerSqFt}
                    compareAtPricePerSqFt={compareAtPricePerSqFt}
                    sqFt={sqFt}
                    onSqFtChange={(value) => setSqFt(parseInt(value) || 0)}
                    currency="CAD"
                  />
                </>
              )}

              {/* Add to Cart Button */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOnAddToCart}
                  disabled={adding || (isAccessory ? quantity < 1 : !sqFt || sqFt <= 0)}
                  className="w-full px-8 py-3.5 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium text-base rounded-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding...' : isAccessory ? `Add ${quantity} to Cart` : `Add ${sqFt > 0 ? `${sqFt} sq ft` : 'to Cart'}`}
                </button>

                <Link
                  href="/cart"
                  className={`block w-full px-8 py-3.5 bg-vfo-accent hover:bg-vfo-accent/90 text-white font-medium text-base rounded-sm shadow-sm transition-all text-center ${
                    showGoToCart ? 'opacity-100 animate-pulse' : 'opacity-0 pointer-events-none'
                  }`}
                  tabIndex={showGoToCart ? 0 : -1}
                  aria-hidden={!showGoToCart}
                >
                  Go to Cart →
                </Link>
              </div>

              {/* Specs - Collapsed/Compact */}
              {allSpecSections.length > 0 && (
                <details className="bg-white rounded-lg border border-vfo-border px-5 py-4">
                  <summary className="cursor-pointer text-base font-heading tracking-wide text-vfo-charcoal">
                    Key Specifications
                  </summary>
                  <div className="mt-4 space-y-6">
                    {allSpecSections.map((section) => (
                      <div key={section.title}>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-vfo-grey mb-3">
                          {section.title}
                        </h3>
                        <table className="w-full text-sm border border-vfo-border">
                          <tbody>
                            {section.entries.map((entry, index) => (
                              <tr key={`${section.title}-${entry.label}-${index}`} className="border-b border-vfo-border last:border-b-0">
                                <th className="w-1/2 text-left font-medium text-vfo-charcoal bg-vfo-sand/60 px-3 py-2">
                                  {entry.label}
                                </th>
                                <td className="px-3 py-2 text-vfo-grey">
                                  {entry.value !== null && entry.value !== undefined && entry.value !== ''
                                    ? String(entry.value)
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Need Help? Phone Contact */}
              <div className="pt-4 border-t border-vfo-border/50">
                <p className="text-xs font-medium uppercase tracking-widest text-vfo-grey mb-2 text-center">
                  Need Help?
                </p>
                <p className="text-xs font-light text-vfo-grey text-center mb-3">
                  Questions about measurements, installation, or shipping?
                </p>
                <a
                  href="tel:+1-778-871-7681"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-vfo-accent text-vfo-accent hover:bg-vfo-accent hover:text-white font-medium text-sm rounded-sm transition-all"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Click to Call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Marketing Copy Sections */}
          {props.collection === 'Contract Series' && (
            <>
              {/* About Harbinger Contract Series */}
              <section className="mb-8 p-6 bg-white rounded-lg border border-vfo-border">
                <h2 className="text-xl font-heading tracking-wide text-vfo-charcoal mb-4">
                  About Harbinger Contract Series
                </h2>
                <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                  Harbinger's Contract Series is a durable, stylish and low-maintenance glue-down vinyl plank built for heavy use at contractor pricing. With a 2.0 mm core, 12 mil wear layer and Harbinger's 4S coating, it delivers excellent resistance to scratches, stains and scuffs while staying soft and warm underfoot.
                </p>
              </section>

              {/* Why we chose Coastal Oak as this week's deal */}
              {props.isWeeklyDeal && props.colourName === 'Coastal Oak' && (
                <section className="mb-8 p-6 bg-white rounded-lg border border-vfo-border">
                  <h2 className="text-xl font-heading tracking-wide text-vfo-charcoal mb-4">
                    Why we chose Coastal Oak as this week's deal
                  </h2>
                  <p className="text-[15px] font-light text-vfo-grey leading-relaxed">
                    Coastal Oak combines a clean, modern grain with a soft oak tone that works in rentals, renos and new builds. It's an easy-to-install glue-down plank that performs in kitchens, basements and light commercial spaces, with 100% waterproof construction and a lifetime residential warranty.
                  </p>
                </section>
              )}
            </>
          )}

          {/* Project Accessories Calculator - for Harbinger flooring products */}
          {showHarbingerNosingInfo && (
            <section className="mt-12">
              <ProjectAccessoriesCalculator sqFt={sqFt} flooringProduct={props} />
            </section>
          )}

          {/* Upsell Products Section - only for non-Harbinger products */}
          {!showHarbingerNosingInfo && upsellProducts.length > 0 && (
            <section className="mt-12 pt-12 border-t border-vfo-border">
              <h2 className="text-2xl md:text-3xl font-heading tracking-wide text-vfo-charcoal mb-2">
                You'll Also Need
              </h2>
              <p className="text-vfo-grey mb-6">
                Essential accessories for your flooring installation. Not sure what you need?{' '}
                <Link href="/accessories" className="text-vfo-accent hover:underline">
                  View our selection guide
                </Link>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upsellProducts.map((upsell) => {
                  // Calculate recommended quantity if this is an accessory with coverage data
                  const recommendedQty = (upsell.coverage && !isAccessory && sqFt > 0)
                    ? calculateAccessoryQuantity(sqFt, upsell)
                    : 1;

                  // Get contextual help text
                  const helpText = upsell.useWhen || upsell.chooseThisIf || null;
                  const helpLabel = upsell.useWhen ? 'Use when:' : (upsell.chooseThisIf ? 'Choose this if:' : null);

                  return (
                    <div
                      key={upsell.id}
                      className="bg-white border border-vfo-border rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <Link href={`/products/${upsell.id}`}>
                        <div className="relative w-full h-40 mb-4 bg-vfo-sand rounded-sm overflow-hidden">
                          <Image
                            src={upsell.image || '/accessories/placeholder.jpg'}
                            alt={upsell.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      <Link href={`/products/${upsell.id}`}>
                        <h3 className="font-heading text-base text-vfo-charcoal mb-2 hover:text-vfo-accent transition-colors leading-tight">{upsell.name}</h3>
                      </Link>

                      {/* Contextual Help - Use When / Choose This If */}
                      {helpText && (
                        <div className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs font-medium text-amber-900 mb-0.5">{helpLabel}</p>
                          <p className="text-xs text-amber-800 leading-relaxed">{helpText}</p>
                        </div>
                      )}

                      {/* Show description only if no help text */}
                      {!helpText && upsell.shortTagline && (
                        <p className="text-sm font-light text-vfo-grey mb-3 leading-relaxed">
                          {upsell.shortTagline}
                        </p>
                      )}

                      {upsell.appearanceNote && (
                        <p className="text-xs text-vfo-bluegrey mb-3">
                          {upsell.appearanceNote}
                        </p>
                      )}

                      <p className="text-lg font-medium text-vfo-charcoal mb-2">
                        {upsell.priceOnRequest ? (upsell.priceNote || 'Call for price') : formatCurrency(upsell.price)}
                      </p>

                      {/* Show coverage info if available and user has entered square footage */}
                      {upsell.coverage && !isAccessory && sqFt > 0 && (
                        <div className="mb-3 p-2 bg-teal-50 rounded border border-teal-100">
                          <p className="text-xs font-medium text-teal-900">
                            Recommended: {recommendedQty} {recommendedQty === 1 ? 'unit' : 'units'}
                          </p>
                          <p className="text-xs text-teal-700">
                            Based on {sqFt} sq ft flooring
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => handleAddUpsell(upsell)}
                        className="w-full px-4 py-2 bg-vfo-charcoal hover:bg-vfo-slate text-white font-medium rounded-sm transition-colors"
                      >
                        {upsell.coverage && !isAccessory && sqFt > 0
                          ? `Add ${recommendedQty} to Cart`
                          : 'Add to Cart'
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export async function getStaticPaths() {
  return {
    paths: products?.map(product => ({
      params: { id: product.id },
    })) || [],
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  try {
    if (params.id?.startsWith('vendor-')) {
      const vendorId = params.id.replace('vendor-', '');
      const vendorProduct = await getVendorProductById(vendorId);
      if (!vendorProduct) {
        return { notFound: true };
      }
      return {
        props: vendorProduct,
        revalidate: 60,
      };
    }

    const props = products?.find(product => product.id === params.id) ?? {};

    return {
      props,
      revalidate: 1,
    };
  } catch (error) {
    return { notFound: true };
  }
}

export default Product;
