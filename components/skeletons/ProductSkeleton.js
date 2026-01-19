export function ProductSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumb Skeleton */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-48 skeleton"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 rounded skeleton"></div>
          <div className="grid grid-cols-4 gap-2">
            <div className="aspect-square bg-gray-200 rounded skeleton"></div>
            <div className="aspect-square bg-gray-200 rounded skeleton"></div>
            <div className="aspect-square bg-gray-200 rounded skeleton"></div>
            <div className="aspect-square bg-gray-200 rounded skeleton"></div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-3/4 skeleton"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 skeleton"></div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded w-32 skeleton"></div>
            <div className="h-4 bg-gray-200 rounded w-24 skeleton"></div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
            <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 skeleton"></div>
          </div>

          {/* Calculator */}
          <div className="border border-gray-200 rounded-sm p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40 skeleton"></div>
            <div className="h-12 bg-gray-200 rounded skeleton"></div>
            <div className="h-10 bg-gray-200 rounded skeleton"></div>
          </div>

          {/* Specifications */}
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-32 skeleton"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-full skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
