'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChefHat, Search, Utensils, Clock, DollarSign, X, ShoppingCart, Minus, Plus, ListOrdered, ChevronUp, ChevronDown, CheckCircle, Hourglass, Truck } from 'lucide-react';

import Header from './Header';
import MenuCard from './MenuCard';
import DetailModal from './DetailModal';
import QueueModal from './QueueModal';
import OrderConfirmationModal from './OrderConfirmationModal';
import CategorySelector from './CategorySelector';
import SearchBar from './SearchBar';

const MENU_DATA_PATH = '/data/menu.json';
const EXTRAS_DATA_PATH = '/data/extras.json';

const priorityStyles = {
    Low: { text: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: ChevronDown },
    Medium: { text: 'text-indigo-400', bg: 'bg-indigo-400/20', icon: ListOrdered },
    High: { text: 'text-red-500', bg: 'bg-red-500/20', icon: ChevronUp },
};

const statusStyles = {
    'Pending': { icon: Hourglass, text: 'text-yellow-400', bg: 'bg-yellow-900', label: 'Pending' },
    'In Progress': { icon: Truck, text: 'text-indigo-400', bg: 'bg-indigo-900', label: 'In Progress' },
    'Ready for Pickup': { icon: CheckCircle, text: 'text-green-400', bg: 'bg-green-900', label: 'Ready' },
};

const RestaurantName = "The Midnight Kitchen";
const apiKey = ""; // API Key for LLM calls (will be empty string here)
const model = "gemini-2.5-flash-preview-09-2025";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

/**
 * Custom hook for exponential backoff retry logic.
 */
const useFetchWithRetry = () => {
  const fetchWithRetry = async (url, options, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      } catch (error) {
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error("Fetch failed after multiple retries:", error);
          throw error;
        }
      }
    }
  };
  return fetchWithRetry;
};

/**
 * Main Application Component
 */
const App = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [extraItems, setExtraItems] = useState([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [llmSuggestion, setLlmSuggestion] = useState('');
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  
  // New State for Modals and Cart
  const [cart, setCart] = useState([]);
  const [queue, setQueue] = useState([]); // 4. Add queue state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false); // 3. Queue modal state
  const [toastMessage, setToastMessage] = useState(null);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);

  const fetchWithRetry = useFetchWithRetry();

  useEffect(() => {
    const loadMenuData = async () => {
      setIsMenuLoading(true);
      setDataError(null);
      try {
        const [menuResponse, extrasResponse] = await Promise.all([
          fetch(MENU_DATA_PATH),
          fetch(EXTRAS_DATA_PATH),
        ]);

        if (!menuResponse.ok || !extrasResponse.ok) {
          throw new Error('Failed to fetch menu data');
        }

        const menuJson = await menuResponse.json();
        const extrasJson = await extrasResponse.json();

        setMenuItems(menuJson.menu ?? []);
        setExtraItems(extrasJson.extras ?? []);
      } catch (error) {
        console.error('Unable to load menu data', error);
        setDataError('Unable to load the menu right now. Please try again soon.');
      } finally {
        setIsMenuLoading(false);
      }
    };

    loadMenuData();
  }, []);

  const menuCategories = useMemo(() => {
    const uniqueCategories = new Map();
    menuItems.forEach(item => {
      if (!item?.categoryId) return;
      if (!uniqueCategories.has(item.categoryId)) {
        uniqueCategories.set(item.categoryId, {
          key: item.categoryId,
          label: item.categoryLabel || item.categoryId,
        });
      }
    });
    return [{ key: 'all', label: 'All' }, ...uniqueCategories.values()];
  }, [menuItems]);

  useEffect(() => {
    if (selectedCategory === 'all') return;
    const exists = menuCategories.some(cat => cat.key === selectedCategory);
    if (!exists) {
      setSelectedCategory('all');
    }
  }, [menuCategories, selectedCategory]);

  const filteredMenu = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.categoryId === selectedCategory);
    }
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return items.sort((a, b) => b.status === 'Available' ? -1 : 1); // Sort available items first
  }, [menuItems, selectedCategory, searchQuery]);

  // Cart logic
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.totalPrice ?? (item.price * (item.quantity || 1));
      return sum + itemTotal;
    }, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // --- Cart and Queue Handlers ---

  const handleShowDetails = useCallback((item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleAddToCart = useCallback((item) => {
    setCart(prevCart => [...prevCart, item]);
    setToastMessage(`Added ${item.quantity}x ${item.name} with ${item.priority} priority!`);
  }, []);

  const handleDirectAddToCart = useCallback((item) => {
    const finalPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
    const newCartItem = {
      ...item,
      quantity: 1,
      extras: [],
      totalPrice: finalPrice,
      priority: 'Medium',
      cartId: Date.now() + Math.random(),
    };

    setCart(prevCart => [...prevCart, newCartItem]);
    setToastMessage(`Added 1x ${item.name} to order!`);
  }, []);

  const handleRemoveCartItem = useCallback((cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  }, []);

  const handleUpdateCartItemQuantity = useCallback((cartId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId) return item;
      const nextQuantity = Math.max(1, item.quantity + delta);
      if (nextQuantity === item.quantity) return item;
      const itemPrice = item.finalPrice !== undefined ? item.finalPrice : item.price;
      const extrasCost = item.extras?.reduce((sum, extra) => sum + (extra.price * extra.qty), 0) || 0;
      const nextTotal = itemPrice * nextQuantity + extrasCost;
      return { ...item, quantity: nextQuantity, totalPrice: nextTotal };
    }));
  }, []);

  const handleUpdateCartItemPriority = useCallback((cartId, label) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId !== cartId) return item;
      const nextPriority = label === 'Fast' ? 'High' : 'Medium';
      return { ...item, priority: nextPriority };
    }));
  }, []);

  // 4. Refactored handlePlaceOrder to add to Queue
  const handlePlaceOrder = useCallback(() => {
    setIsOrderModalOpen(false);
    
    // Calculate total preparation time based on items (simplified)
    const totalPrepTime = cart.reduce((sum, item) => sum + (item.time * item.quantity), 0);
    const orderId = crypto.randomUUID();

    const priorityRank = { Low: 1, Medium: 2, High: 3 };
    const highestPriority = cart.reduce((current, item) => {
      const value = priorityRank[item.priority || 'Medium'] || 2;
      return value > current ? value : current;
    }, 2);
    const highestPriorityLabel = Object.keys(priorityRank).find(key => priorityRank[key] === highestPriority) || 'Medium';

    // Create a new order object for the queue
    const newOrder = {
        orderId: orderId,
        items: cart,
        total: cartTotal,
        orderPriority: highestPriorityLabel,
        status: 'Pending', // Initial status
        timeAdded: Date.now(),
        timeRemaining: Math.ceil(totalPrepTime / 2), // Simulate time in seconds
        estimatedTotalTime: Math.ceil(totalPrepTime / 2),
    };

    setQueue(prevQueue => [...prevQueue, newOrder]);
    setCart([]); // Clear cart after placing order
    setToastMessage(`Order #${orderId.slice(-4)} placed! Added to queue.`);
    setIsOrderSuccessModalOpen(true);
  }, [cart, cartTotal]);

  const handleFinishOrder = useCallback((orderId) => {
    setQueue(prevQueue => prevQueue.filter(order => order.orderId !== orderId));
    setToastMessage(`Order #${orderId.slice(-4)} picked up!`);
  }, []);

  // 5. Queue Time Status Simulation
  useEffect(() => {
    if (queue.length === 0) return;

    // Timer runs every second to update queue statuses
    const interval = setInterval(() => {
        setQueue(prevQueue => {
            return prevQueue.map(order => {
                if (order.status === 'Pending') {
                    // Start preparation after 5 seconds of pending time (simulated)
                    if (Date.now() - order.timeAdded > 5000) {
                        return { ...order, status: 'In Progress' };
                    }
                } else if (order.status === 'In Progress') {
                    // Decrease remaining time
                    const newTimeRemaining = Math.max(0, order.timeRemaining - 1);
                    if (newTimeRemaining === 0) {
                        return { ...order, status: 'Ready for Pickup', timeRemaining: 0 };
                    }
                    return { ...order, timeRemaining: newTimeRemaining };
                }
                return order;
            });
        });
    }, 1000);

    return () => clearInterval(interval);
  }, [queue]);


  const fetchLlmSuggestion = useCallback(async () => {
    if (!menuItems.length) {
      setLlmSuggestion("Discover our carefully curated menu, crafted for an exceptional dining experience.");
      return;
    }

    setIsLlmLoading(true);
    setLlmSuggestion('');

    const categoryLabels = menuCategories
      .filter(c => c.key !== 'all')
      .map(c => c.label)
      .join(', ') || 'Chef-curated selections';

    const highlightedDishes = menuItems
      .slice(0, 3)
      .map(d => d.name)
      .join(', ') || 'our signature favorites';

    const query = `You are a helpful restaurant assistant. Based on the current menu categories: ${categoryLabels}, and the popular dishes: ${highlightedDishes}, suggest a short, enticing opening message for the menu in a professional, dark-theme tone. Keep it under 20 words.`;

    const payload = {
        contents: [{ parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: "Act as a professional restaurant menu greeting assistant." }] },
    };

    try {
      const response = await fetchWithRetry(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      const result = await response.json();

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setLlmSuggestion(text.trim());
      }
    } catch (error) {
      console.error("Error fetching LLM suggestion:", error);
      setLlmSuggestion("Discover our carefully curated menu, crafted for an exceptional dining experience."); // Fallback
    } finally {
      setIsLlmLoading(false);
    }
  }, [fetchWithRetry, menuCategories, menuItems]);

  // --- Helper Effects ---

  // Fetch suggestion when menu data is ready
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchLlmSuggestion();
    }
  }, [menuItems, fetchLlmSuggestion]);

  // Manage Toast messages
  useEffect(() => {
    if (toastMessage) {
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Close order success modal after a few seconds
  useEffect(() => {
    if (isOrderSuccessModalOpen) {
        const timer = setTimeout(() => setIsOrderSuccessModalOpen(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [isOrderSuccessModalOpen]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased pb-30">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20"> {/* pb-20 for fixed bottom navigation */}
        
        {/* 1 & 2: Header (Restaurant Name, Menu Text, Icon) */}
        <Header restaurantName={RestaurantName} />

        {/* LLM Suggestion Banner */}
        {/* <div className="mb-6 p-4 bg-indigo-900/40 border border-indigo-700 rounded-xl text-sm italic text-center text-indigo-200">
            {isLlmLoading ? (
                <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-300 mr-2"></div>
                    Loading special greeting...
                </div>
            ) : (
                llmSuggestion || "Taste the difference in every dish we prepare."
            )}
        </div> */}

        {/* 3: Search Bar */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* 4: Category Selector */}
        <div className="mb-6">
          <CategorySelector
            menuCategories={menuCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* 5: Menu Card Display */}
        {dataError ? (
          <div className="text-center py-12 bg-red-900/40 border border-red-700 rounded-xl text-red-200">
            <Utensils className="w-10 h-10 mx-auto mb-3 text-red-300" />
            <p className="text-lg font-semibold">Menu unavailable</p>
            <p className="text-sm">{dataError}</p>
          </div>
        ) : isMenuLoading ? (
          <div className="text-center py-16 bg-gray-800 rounded-xl text-gray-400 animate-pulse">
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-lg font-medium">Preparing your menu...</p>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </div>
        ) : filteredMenu.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {filteredMenu.map((item) => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onShowDetails={handleShowDetails} // Card body click
                onAddToCartDirectly={handleDirectAddToCart} // Plus button click
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-xl text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">No dishes found.</p>
            <p className="text-sm">Try adjusting your category or search term.</p>
          </div>
        )}
      </div>

      {/* 3. Fixed Bottom Navigation (with Queue button) */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-gray-800 border-t border-gray-700 shadow-2xl p-3 z-10 rounded-t-2xl">
        <div className="flex justify-around items-center">
          <button className="text-indigo-400 flex flex-col items-center text-xs p-1">
            <Utensils className="w-6 h-6" />
            <span className="mt-1">Menu</span>
          </button>
          
          <button 
            className="text-gray-400 hover:text-green-400 flex flex-col items-center text-xs p-1 relative disabled:opacity-50"
            onClick={() => cartItemCount > 0 && setIsOrderModalOpen(true)}
            disabled={cartItemCount === 0}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="mt-1">Order</span>
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* 3. Queue Button */}
          <button 
            className="text-gray-400 hover:text-red-400 flex flex-col items-center text-xs p-1 relative disabled:opacity-50"
            onClick={() => setIsQueueModalOpen(true)}
          >
            <ListOrdered className="w-6 h-6" />
            <span className="mt-1">Queue</span>
            {queue.length > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* 2. Item Detail Modal */}
      {isDetailModalOpen && (
        <DetailModal
          item={selectedItem}
          extraItems={extraItems}
          priorityStyles={priorityStyles}
          onClose={handleCloseDetailModal}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* 4. Order Confirmation Modal */}
      {isOrderModalOpen && (
        <OrderConfirmationModal
            cart={cart}
            total={cartTotal}
            priorityStyles={priorityStyles}
            onRemoveItem={handleRemoveCartItem}
            onUpdateItemQuantity={handleUpdateCartItemQuantity}
            onUpdateItemPriority={handleUpdateCartItemPriority}
            onClose={() => setIsOrderModalOpen(false)}
            onConfirm={handlePlaceOrder}
        />
      )}
      
      {/* 5. Queue Modal */}
      {isQueueModalOpen && (
        <QueueModal
            queue={queue}
            statusStyles={statusStyles}
            priorityStyles={priorityStyles}
            onClose={() => setIsQueueModalOpen(false)}
            onFinishOrder={handleFinishOrder}
        />
      )}

      {/* Toast Message for quick adds */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-green-500 text-gray-900 rounded-xl shadow-2xl font-semibold transition-all duration-300">
            {toastMessage}
        </div>
      )}

      {/* Order Success Toast/Modal */}
      {isOrderSuccessModalOpen && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 p-4 bg-indigo-600 text-white rounded-xl shadow-2xl font-semibold">
            🎉 Order Placed Successfully! Processing Now...
        </div>
      )}

      {/* Global Style for Scrollbar hide (helps mobile aesthetic) */}
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default App;
