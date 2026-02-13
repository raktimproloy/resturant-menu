import { Clock, Plus, Tag } from 'lucide-react';

const MenuCard = ({ item, onShowDetails, onAddToCartDirectly }) => {
  const fallbackImage = `https://placehold.co/600x400/475569/f1f5f9?text=${item.name.split(' ')[0]}`;
  const primaryImage = item.images?.[0] || fallbackImage;
  
  // Calculate prices
  const originalPrice = item.price || 0;
  const hasDiscount = item.discount && (item.discount.type === 'percentage' || item.discount.type === 'price');
  const finalPrice = item.finalPrice !== undefined ? item.finalPrice : originalPrice;
  const discountAmount = hasDiscount ? (originalPrice - finalPrice) : 0;
  const discountPercent = hasDiscount && item.discount.type === 'percentage' 
    ? item.discount.value 
    : hasDiscount 
      ? Math.round((discountAmount / originalPrice) * 100) 
      : 0;

  return (
    <div
      className={`group bg-gray-800 rounded-2xl overflow-hidden shadow-lg transform transition duration-300 min-h-[220px] sm:min-h-[250px] w-full min-w-0 flex flex-col ${item.status === 'Available' ? 'hover:shadow-indigo-800/40 hover:-translate-y-1 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
      onClick={() => item.status === 'Available' && onShowDetails(item)}
    >
      <div className="relative h-40 sm:h-48 w-full overflow-hidden shrink-0">
        {/* Image — larger, centered crop for focus */}
        <img
          src={primaryImage}
          alt={item.name}
          className="object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />
        {item.isExtra && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-[11px] uppercase tracking-wide font-bold px-2.5 py-0.5 rounded-full text-white">
            Add-on
          </div>
        )}
        {item.tag && !item.isExtra && (
          <div className="absolute top-2 left-2 bg-indigo-500/80 text-[11px] uppercase tracking-wide font-bold px-2.5 py-0.5 rounded-full text-white">
            {item.tag}
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500/90 text-[11px] uppercase tracking-wide font-bold px-2.5 py-0.5 rounded-full text-white flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {discountPercent}% OFF
          </div>
        )}
        {item.status !== 'Available' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs sm:text-sm font-semibold uppercase tracking-wide text-white">
            Not Available
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col min-h-0 flex-1 overflow-hidden">
        {/* Name */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-50 mb-2 line-clamp-2 leading-tight">
          {item.name}
        </h3>

        {/* Details */}
        {item.time !== undefined && item.time > 0 && (
          <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
            <div className="flex items-center text-indigo-300 font-medium">
              <Clock className="w-4 h-4 mr-1" />
              <span>{item.time} min</span>
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {hasDiscount ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {originalPrice} ৳
                </span>
                <span className="text-lg sm:text-xl font-bold text-green-400">
                  {finalPrice} ৳
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-bold text-green-400">
                {originalPrice} ৳
              </span>
            )}
          </div>
          <button
            className={`p-2.5 sm:p-3 rounded-full transition duration-150 ${item.status === 'Available' ? 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
            onClick={(e) => {
              e.stopPropagation(); 
              item.status === 'Available' && onAddToCartDirectly(item); 
            }}
            disabled={item.status !== 'Available'}
            aria-label={`Add 1 ${item.name} to cart`}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;