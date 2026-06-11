import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Edit3, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  Check, 
  X, 
  Moon, 
  Sun, 
  JapaneseYen, 
  Inbox, 
  TrendingUp, 
  Sparkles,
  Calendar,
  AlertCircle,
  FileText,
  Camera,
  Upload,
  RefreshCw
} from 'lucide-react';

// --- TYPE DECLARATIONS ---
interface GroceryItem {
  id: string;
  name: string;
  price: number;
  note: string;
  isPurchased: boolean;
  createdAt: string; // ISO DateTime
  image?: string; // Base64 data URL
}

// Initial Mock items so the app doesn't start blank
const INITIAL_ITEMS: GroceryItem[] = [
  {
    id: "1",
    name: "Organic Strawberries",
    price: 680,
    note: "Buy fresh packs with no green tops",
    isPurchased: false,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: "2",
    name: "Whole Milk (Gallon)",
    price: 380,
    note: "2% fat; check expiration dates",
    isPurchased: false,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: "3",
    name: "Fresh Sourdough Bread",
    price: 450,
    note: "From bakery department",
    isPurchased: true,
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString()
  },
  {
    id: "4",
    name: "Greek Vanilla Yogurt",
    price: 580,
    note: "Pick the 1kg honey flavor tub",
    isPurchased: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];

export default function App() {
  // --- STATE STORES ---
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const cached = localStorage.getItem('grocery_items_data');
    return cached ? JSON.parse(cached) : INITIAL_ITEMS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'purchased'>('all');
  const [sortOption, setSortOption] = useState<
    'newest' | 'oldest' | 'price_desc' | 'price_asc' | 'purchased_first' | 'pending_first'
  >('newest');

  // Modal control states
  const [isAddingModalOpen, setIsAddingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<GroceryItem | null>(null);
  
  // Simulated mobile UI states
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [phoneTheme, setPhoneTheme] = useState<'light' | 'dark'>(() => {
    const cachedTheme = localStorage.getItem('grocery_app_theme');
    return (cachedTheme === 'dark' || cachedTheme === 'light') ? cachedTheme : 'light';
  });

  // Total Budget State
  const [totalBudget, setTotalBudget] = useState<number>(() => {
    const cached = localStorage.getItem('grocery_total_budget');
    return cached ? parseFloat(cached) : 15000; // default budget is ¥15000
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(totalBudget.toString());

  // Input bindings
  const [inputName, setInputName] = useState('');
  const [inputPrice, setInputPrice] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [modalStream, setModalStream] = useState<MediaStream | null>(null);
  const [modalCameraError, setModalCameraError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const itemFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const startModalCamera = async () => {
    setModalCameraError(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setModalCameraError("Camera permission blocked or browser mode not supported. You can still use 'Choose File' to upload/capture a photo!");
      return;
    }
    try {
      const constraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setModalStream(mediaStream);
      setIsLiveCameraActive(true);
      setTimeout(() => {
        if (modalVideoRef.current) {
          modalVideoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err: any) {
      console.warn("Could not start environment camera for item, trying default video", err);
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("No media devices support");
        }
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setModalStream(fallbackStream);
        setIsLiveCameraActive(true);
        setTimeout(() => {
          if (modalVideoRef.current) {
            modalVideoRef.current.srcObject = fallbackStream;
          }
        }, 50);
      } catch (fallbackErr: any) {
        console.warn("Item camera access blocked/denied:", fallbackErr);
        setModalCameraError("Camera permission blocked. You can still use 'Choose File' to upload or capture on mobile devices.");
      }
    }
  };

  const stopModalCamera = () => {
    if (modalStream) {
      modalStream.getTracks().forEach(track => track.stop());
      setModalStream(null);
    }
    setIsLiveCameraActive(false);
  };

  const handleItemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInputImage(reader.result as string);
        stopModalCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-close camera if modal exits
  useEffect(() => {
    if (!isAddingModalOpen && !editingItem) {
      stopModalCamera();
    }
  }, [isAddingModalOpen, editingItem]);

  // Clean stream on direct component unmount
  useEffect(() => {
    return () => {
      if (modalStream) {
        modalStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modalStream]);

  // Time ticking for phone mock status bar
  const [currentTime, setCurrentTime] = useState('');

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('grocery_items_data', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('grocery_app_theme', phoneTheme);
  }, [phoneTheme]);

  useEffect(() => {
    localStorage.setItem('grocery_total_budget', totalBudget.toString());
  }, [totalBudget]);

  // Keep phone simulator time updated
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- BUSINESS METRICS ---
  const totalCount = items.length;
  const purchasedCount = items.filter(it => it.isPurchased).length;
  const pendingCount = items.filter(it => !it.isPurchased).length;

  const totalPlannedExpense = items.reduce((sum, it) => sum + it.price, 0);
  const totalPurchasedExpense = items.filter(it => it.isPurchased).reduce((sum, it) => sum + it.price, 0);
  const totalPendingExpense = items.filter(it => !it.isPurchased).reduce((sum, it) => sum + it.price, 0);

  // Spend percentage (purchased vs planned)
  const spendPercentage = totalPlannedExpense > 0 
    ? (totalPurchasedExpense / totalPlannedExpense) * 100 
    : 0;

  // Budget spent percentage (purchased vs total budget)
  const budgetSpentPercentage = totalBudget > 0 
    ? (totalPurchasedExpense / totalBudget) * 100 
    : 0;

  // Remaining budget
  const remainingBudget = totalBudget - totalPurchasedExpense;

  // --- FILTER & SORT CALCULATION ---
  const getProcessedItems = () => {
    let result = [...items];

    // Filter by tab
    if (activeTab === 'pending') {
      result = result.filter(item => !item.isPurchased);
    } else if (activeTab === 'purchased') {
      result = result.filter(item => item.isPurchased);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.note.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort accordingly
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'purchased_first':
        result.sort((a, b) => {
          if (a.isPurchased === b.isPurchased) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isPurchased ? -1 : 1;
        });
        break;
      case 'pending_first':
        result.sort((a, b) => {
          if (a.isPurchased === b.isPurchased) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isPurchased ? 1 : -1;
        });
        break;
    }

    return result;
  };

  const processedList = getProcessedItems();

  // --- MUTATION ACTIONS ---
  const handleOpenAddModal = () => {
    setInputName('');
    setInputPrice('');
    setInputNote('');
    setInputImage(null);
    setValidationError(null);
    setIsAddingModalOpen(true);
    stopModalCamera();
  };

  const handleOpenEditModal = (item: GroceryItem) => {
    setEditingItem(item);
    setInputName(item.name);
    setInputPrice(item.price.toString());
    setInputNote(item.note);
    setInputImage(item.image || null);
    setValidationError(null);
    stopModalCamera();
  };

  const handleToggleItemStatus = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
    ));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      setValidationError("Item Name is required.");
      return;
    }
    const valPrice = parseFloat(inputPrice);
    if (isNaN(valPrice) || valPrice < 0) {
      setValidationError("Provide a valid non-negative numerical price.");
      return;
    }

    if (editingItem) {
      // Update item
      setItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? { ...item, name: inputName.trim(), price: valPrice, note: inputNote.trim(), image: inputImage || undefined }
          : item
      ));
      setEditingItem(null);
    } else {
      // Create new item
      const newItem: GroceryItem = {
        id: Date.now().toString(),
        name: inputName.trim(),
        price: valPrice,
        note: inputNote.trim(),
        isPurchased: false,
        createdAt: new Date().toISOString(),
        image: inputImage || undefined
      };
      setItems(prev => [...prev, newItem]);
      setIsAddingModalOpen(false);
    }

    // Reset components input
    setInputName('');
    setInputPrice('');
    setInputNote('');
    setInputImage(null);
    setValidationError(null);
    stopModalCamera();
  };

  const handleDeleteItem = () => {
    if (deletingItem) {
      setItems(prev => prev.filter(item => item.id !== deletingItem.id));
      setDeletingItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 💻 Simulation Deck Workspace Container */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 px-4 sm:py-10 bg-radial from-slate-900 to-slate-950">
        
        {/* Device Wrapper - Bezel on desktop, direct full viewport on phone viewport */}
        <div className="relative w-full max-w-[420px] bg-slate-950 p-3 sm:p-4 rounded-[42px] sm:border-[8px] sm:border-slate-800 shadow-2xl overflow-hidden min-h-[100dvh] sm:min-h-[820px] flex flex-col justify-between">
          
          {/* Smartphone Hardware Elements (Bezel details - notches, speakers) */}
          <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-40 items-center justify-center gap-1.5">
            <div className="w-12 h-1 bg-slate-850 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800"></div>
          </div>

          {/* Inner Mobile Simulated Screen viewbox */}
          <div className={`relative flex-1 rounded-[32px] sm:rounded-[28px] overflow-hidden flex flex-col transition-all duration-350 w-full ${
            phoneTheme === 'dark' 
              ? 'bg-zinc-950 text-zinc-100' 
              : 'bg-slate-50 text-slate-900'
          }`}>
            
            {/* Status bar */}
            <div className={`px-6 pt-3 pb-2 flex justify-between items-center text-xs font-semibold z-30 tracking-tight transition-all duration-300 ${
              phoneTheme === 'dark' ? 'text-zinc-400 bg-zinc-950' : 'text-slate-600 bg-slate-50'
            }`}>
              <span>{currentTime || "12:15"}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 items-end opacity-85">
                  <span className="w-0.5 h-1.5 bg-current rounded-sm"></span>
                  <span className="w-0.5 h-2 bg-current rounded-sm"></span>
                  <span className="w-0.5 h-2.5 bg-current rounded-sm"></span>
                  <span className="w-0.5 h-3.5 bg-current rounded-sm"></span>
                </div>
                {/* Simulated battery cell shape */}
                <span className="inline-block relative w-5.5 h-3 rounded-xs border-1.5 border-current px-0.5 py-0.5">
                  <span className="absolute top-0.5 -right-0.75 w-0.5 h-1.5 bg-current rounded-r-xs"></span>
                  <span className="block h-full w-4/5 bg-emerald-500 rounded-2xs"></span>
                </span>
              </div>
            </div>

            {/* Simulated UI Top App Bar */}
            <header className={`px-5 py-4 flex items-center justify-between border-b transition-all duration-300 ${
              phoneTheme === 'dark' 
                ? 'border-zinc-900 bg-zinc-950/95' 
                : 'border-slate-200/80 bg-slate-50/95'
            } backdrop-blur-md sticky top-0 z-30`}>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/15">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight">
                    Grocery List
                  </h2>
                  <p className="text-[10px] opacity-70">Expense Tracker</p>
                </div>
              </div>
              
              {/* Theme switch state controller */}
              <button
                onClick={() => setPhoneTheme(prev => prev === 'light' ? 'dark' : 'light')}
                className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 ${
                  phoneTheme === 'dark'
                    ? 'border-zinc-800 text-yellow-400 bg-zinc-90 w-9 h-9'
                    : 'border-slate-200 text-indigo-600 bg-white shadow-xs w-9 h-9'
                } flex items-center justify-center`}
                title="Toggle UI Color Tone"
                id="theme-toggler"
              >
                {phoneTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </header>

            {/* Scrollable interior viewport content */}
            <div className="flex-1 overflow-y-auto px-4.5 py-4 flex flex-col gap-4 pb-28">
              
              {/* 💸 EXPENSE SUMMARY CARDS */}
              <div className={`p-4 rounded-2xl border transition-all duration-350 shadow-xs ${
                phoneTheme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-850'
                  : 'bg-white border-slate-200/80'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                      Expense Summary
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Interactive Budget Section Area */}
                <div className={`grid grid-cols-2 gap-3 mb-3 p-3 rounded-xl border transition-all ${
                  phoneTheme === 'dark'
                    ? 'bg-zinc-950/40 border-zinc-900'
                    : 'bg-slate-50/70 border-slate-100'
                }`}>
                  <div>
                    <span className="text-[9px] block font-bold tracking-wider uppercase opacity-60">
                      Total Budget
                    </span>
                    {isEditingBudget ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const val = parseFloat(budgetInput);
                          if (!isNaN(val) && val >= 0) {
                            setTotalBudget(val);
                            setIsEditingBudget(false);
                          }
                        }}
                        className="flex items-center gap-1 mt-0.5"
                      >
                        <span className="text-xs font-mono font-bold">¥</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          className={`w-20 px-1.5 py-0.5 font-mono text-xs rounded border focus:outline-none focus:ring-1 focus:ring-teal-500 font-extrabold ${
                            phoneTheme === 'dark'
                              ? 'bg-zinc-950 border-zinc-800 text-white'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                          autoFocus
                          onBlur={() => {
                            const val = parseFloat(budgetInput);
                            if (!isNaN(val) && val >= 0) {
                              setTotalBudget(val);
                            }
                            setIsEditingBudget(false);
                          }}
                        />
                        <button 
                          type="submit" 
                          className="p-1 text-emerald-500 hover:text-emerald-400"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-xs sm:text-sm font-black text-teal-600 dark:text-teal-400">
                          ¥{totalBudget.toFixed(0)}
                        </span>
                        <button
                          onClick={() => {
                            setBudgetInput(totalBudget.toString());
                            setIsEditingBudget(true);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-teal-500 hover:bg-slate-150 dark:hover:bg-zinc-800 transition active:scale-90"
                          title="Edit budget"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] block font-bold tracking-wider uppercase opacity-60">
                      Remaining
                    </span>
                    <span className={`font-mono text-xs sm:text-sm font-black block mt-1 ${
                      remainingBudget < 0
                        ? 'text-red-500 dark:text-red-400 animate-pulse'
                        : 'text-emerald-500 dark:text-emerald-400'
                    }`}>
                      ¥{remainingBudget.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Progress bar illustrating target budget completion ratio */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between items-center text-[10px] opacity-75 font-semibold">
                    <span>Budget Spent</span>
                    <span className={remainingBudget < 0 ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                      {budgetSpentPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${
                    phoneTheme === 'dark' ? 'bg-zinc-800' : 'bg-slate-100'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        remainingBudget < 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${Math.min(100, budgetSpentPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] opacity-60 font-medium">
                    <span>Spent: ¥{totalPurchasedExpense.toFixed(0)}</span>
                    <span>Budget Limit: ¥{totalBudget.toFixed(0)}</span>
                  </div>
                </div>

                {/* Grid Financial metrics dashboard */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-dashed border-slate-100 dark:border-zinc-800/85">
                  <div className="p-1 rounded-lg">
                    <span className="text-[9px] block mb-0.5 font-semibold opacity-60">
                      Planned
                    </span>
                    <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400">
                      ¥{totalPlannedExpense.toFixed(0)}
                    </span>
                  </div>
                  <div className={`p-1 rounded-lg ${phoneTheme === 'dark' ? 'bg-zinc-950/20' : 'bg-slate-50/50'}`}>
                    <span className="text-[9px] block mb-0.5 font-semibold text-emerald-600">
                      Purchased
                    </span>
                    <span className="font-mono text-xs font-extrabold text-emerald-505">
                      ¥{totalPurchasedExpense.toFixed(0)}
                    </span>
                  </div>
                  <div className="p-1 rounded-lg">
                    <span className="text-[9px] block mb-0.5 font-semibold text-amber-600">
                      Pending
                    </span>
                    <span className="font-mono text-xs font-extrabold text-amber-500">
                      ¥{totalPendingExpense.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 🔍 SEARCH AND TOOLBAR WRAPPER */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-2.5 w-4 h-4 ${
                    phoneTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all ${
                      phoneTheme === 'dark'
                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder-zinc-550'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-2xs'
                    }`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.25 hover:text-red-400 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowSortDropdown(prev => !prev)}
                  className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                    showSortDropdown 
                      ? 'bg-teal-500 border-teal-500 text-white' 
                      : phoneTheme === 'dark'
                        ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-850'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 shadow-2xs'
                  }`}
                  title="Sorting Options"
                  id="sort-menu-trigger"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* 🎛️ EXPANDABLE SORT SELECTOR PANE */}
              {showSortDropdown && (
                <div className={`p-3.5 rounded-xl border text-xs transition duration-200 flex flex-col gap-2 ${
                  phoneTheme === 'dark'
                    ? 'bg-zinc-900 border-zinc-850'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center pb-1">
                    <span className="font-bold text-[10px] text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Sorting Criteria
                    </span>
                    <button onClick={() => setShowSortDropdown(false)}>
                      <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { key: 'newest', val: 'Newest Added' },
                      { key: 'oldest', val: 'Oldest Added' },
                      { key: 'price_desc', val: 'Price: High-Low' },
                      { key: 'price_asc', val: 'Price: Low-High' },
                      { key: 'purchased_first', val: 'Purchased First' },
                      { key: 'pending_first', val: 'Pending First' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortOption(opt.key as any);
                          setShowSortDropdown(false);
                        }}
                        className={`px-2.5 py-1.5 text-left rounded-lg transition duration-150 border ${
                          sortOption === opt.key
                            ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30 font-semibold'
                            : phoneTheme === 'dark'
                              ? 'border-transparent hover:bg-zinc-800 text-zinc-300'
                              : 'border-transparent hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 🏷️ ITEM VIEW CONTROLLER (ALL / PENDING / PURCHASED TABS) */}
              <div className="flex border-b border-dashed border-slate-200 dark:border-zinc-850 p-0.5 gap-1">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  { id: 'purchased', label: `Purchased (${purchasedCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-teal-500 text-white font-black shadow-xs'
                        : phoneTheme === 'dark'
                          ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 📋 LIST VIEWBOARD */}
              {items.length === 0 ? (
                <div className="flex-1 py-14 flex flex-col items-center justify-center text-center">
                  <div className="p-4 bg-teal-500/10 rounded-full text-teal-500 mb-3.5 border border-teal-500/15">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-bold opacity-80">Grocery list is empty</h3>
                  <p className="text-[11px] opacity-60 mt-1 max-w-[200px]">
                    Tap the green "+" button on the bottom right to start tracking.
                  </p>
                </div>
              ) : processedList.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="p-3 bg-red-500/10 rounded-full text-red-500 mb-2 border border-red-500/15">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold opacity-70">
                    No matching items found
                  </p>
                  <p className="text-[10px] opacity-50 mt-1">
                    Try adjusting your search filters or tags.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {processedList.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                        item.isPurchased
                          ? phoneTheme === 'dark'
                            ? 'bg-zinc-900/30 border-zinc-950 opacity-65'
                            : 'bg-emerald-50/40 border-emerald-100/70 opacity-80'
                          : phoneTheme === 'dark'
                            ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Elegant check box container */}
                          <button
                            onClick={() => handleToggleItemStatus(item.id)}
                            className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                              item.isPurchased
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : phoneTheme === 'dark'
                                  ? 'border-zinc-700 hover:border-zinc-550'
                                  : 'border-slate-300 hover:border-slate-450 bg-white'
                            }`}
                            aria-label={`Toggle purchase status for ${item.name}`}
                          >
                            {item.isPurchased && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                          </button>

                          {item.image && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200/60 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center self-center shadow-2xs">
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-bold leading-tight truncate ${
                              item.isPurchased 
                                ? 'line-through text-zinc-500 dark:text-zinc-500' 
                                : ''
                            }`}>
                              {item.name}
                            </h4>
                            
                            <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] font-bold">
                              <JapaneseYen className="w-3 h-3 text-teal-650 shrink-0" />
                              <span className="text-teal-650 dark:text-teal-400">
                                {item.price.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Edit and Trash interaction block */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-500 active:scale-90 transition"
                            title="Edit details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 active:scale-90 transition"
                            title="Delete item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Display item context note when available */}
                      {item.note && (
                        <div className={`mt-2.5 text-[10px] leading-relaxed p-2 rounded-lg flex gap-1.5 items-start ${
                          phoneTheme === 'dark' 
                            ? 'bg-zinc-950 text-zinc-400' 
                            : 'bg-slate-100/80 text-slate-650'
                        }`}>
                          <FileText className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                          <span className="break-all">{item.note}</span>
                        </div>
                      )}

                      {/* Created date summary label */}
                      <div className="mt-2 text-[9px] opacity-50 flex items-center gap-1 pl-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FLOATING ACTION BUTTON (Inside Simulated viewport) */}
            <button
              onClick={handleOpenAddModal}
              className="absolute bottom-6 right-6 flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-extrabold text-xs py-2.5 px-4.5 rounded-full shadow-lg z-30 transition-all duration-150"
              id="add-item-fab"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>Add Item</span>
            </button>

            {/* Simulated home swipe visual bar */}
            <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-30 opacity-40 ${
              phoneTheme === 'dark' ? 'bg-zinc-800' : 'bg-slate-400'
            }`}></div>
          </div>
        </div>
      </main>

      {/* ================= MODAL DIALOG OVERLAYS ================= */}
      
      {/* 1. ADD / EDIT DIALOG FORM SHEET */}
      {(isAddingModalOpen || editingItem) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[400px] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => {
                setIsAddingModalOpen(false);
                setEditingItem(null);
                stopModalCamera();
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/15">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-extrabold text-white">
                {editingItem ? 'Edit Item Details' : 'Add Grocery Item'}
              </h3>
            </div>
            
            <p className="text-xs text-slate-400 mb-5">
              {editingItem ? 'Edit item parameters below and tap save changes.' : 'Fill in the parameters below to add your new shopping item.'}
            </p>

            <form onSubmit={handleSaveItem} className="flex flex-col gap-4">
              {/* Image Input and Item Name Row */}
              <div className="flex gap-4">
                {/* Photo Trigger Square */}
                <div className="flex flex-col items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 self-start">
                    Photo
                  </label>
                  <div 
                    onClick={() => itemFileInputRef.current?.click()}
                    className="relative w-20 h-20 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-slate-700 transition shrink-0 group shadow-xs leading-none"
                    title="Click to Choose Photo"
                  >
                    {inputImage ? (
                      <>
                        <img 
                          src={inputImage} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInputImage(null);
                          }}
                          className="absolute top-1 right-1 p-1 bg-slate-950/95 text-slate-400 hover:text-white rounded-full border border-slate-800/80 shadow transition opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center flex flex-col items-center justify-center p-2 text-[8px] text-slate-500">
                        <Camera className="w-5 h-5 text-slate-400 mb-1" />
                        <span>Add Image</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name section and action triggers */}
                <div className="flex-1 mt-0.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fresh Bananas"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                    autoFocus
                    id="item-name-input"
                  />
                  
                  <div className="flex gap-1.5 pt-1.5">
                    <button
                      type="button"
                      onClick={() => itemFileInputRef.current?.click()}
                      className="text-[9px] font-bold bg-slate-950 hover:bg-slate-850 text-slate-300 py-1 px-2.5 rounded-lg border border-slate-850 flex items-center gap-1 transition"
                    >
                      <Upload className="w-2.5 h-2.5" />
                      Upload
                    </button>

                    <button
                      type="button"
                      onClick={isLiveCameraActive ? stopModalCamera : startModalCamera}
                      className={`text-[9px] font-bold py-1 px-2.5 rounded-lg border flex items-center gap-1 transition ${
                        isLiveCameraActive
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          : 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20'
                      }`}
                    >
                      <Camera className="w-2.5 h-2.5" />
                      {isLiveCameraActive ? 'Close Cam' : 'Live Camera'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hidden Inputs */}
              <input
                type="file"
                ref={itemFileInputRef}
                accept="image/*"
                onChange={handleItemFileChange}
                className="hidden"
              />

              {/* Embedded webcam frame */}
              {isLiveCameraActive && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex flex-col gap-2 relative animate-in slide-in-from-top-2 duration-150-all">
                  {modalCameraError ? (
                    <div className="text-[10px] text-amber-400 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{modalCameraError}</span>
                    </div>
                  ) : (
                    <>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-slate-800 max-h-[140px]">
                        <video 
                          ref={modalVideoRef}
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-3 border border-dashed border-teal-550/40 rounded-md pointer-events-none flex items-center justify-center">
                          <span className="text-[8px] font-bold text-teal-400/60 bg-slate-950/85 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Align Item Preview
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={stopModalCamera}
                          className="py-1 px-2 text-[10px] font-semibold text-slate-400 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (modalVideoRef.current) {
                              const video = modalVideoRef.current;
                              const canvas = document.createElement("canvas");
                              const size = Math.min(video.videoWidth || 320, video.videoHeight || 320);
                              const x = ((video.videoWidth || 320) - size) / 2;
                              const y = ((video.videoHeight || 320) - size) / 2;
                              canvas.width = 240;
                              canvas.height = 240;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                ctx.drawImage(video, x, y, size, size, 0, 0, 240, 240);
                                setInputImage(canvas.toDataURL("image/jpeg", 0.85));
                                stopModalCamera();
                              }
                            }
                          }}
                          className="py-1 px-2.5 bg-teal-500 hover:bg-teal-450 text-white font-extrabold text-[10px] rounded-lg shadow transition flex items-center gap-1"
                        >
                          <Camera className="w-2.5 h-2.5" />
                          Snap Photo
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Price (¥) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.25 text-slate-500 text-xs">¥</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    placeholder="0"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    className="w-full pl-6.5 pr-3 py-2 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                    id="item-price-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Note (Optional)
                </label>
                <textarea
                  placeholder="e.g. Pack of 6, slightly green"
                  rows={2}
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 text-white border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  id="item-note-input"
                />
              </div>

              {validationError && (
                <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl border border-red-500/15 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3.5 border-t border-slate-850 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-450 text-white rounded-xl shadow-md transition"
                  id="dialog-save-btn"
                >
                  {editingItem ? 'Save Changes' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DELETE CONFIRMATION SHEETS */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-[360px] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-extrabold text-white mb-2">
              Remove Item?
            </h3>
            <p className="text-xs text-slate-400 pb-1">
              Are you sure you want to delete <span className="font-bold text-slate-200">"{deletingItem.name}"</span>? This action is permanent and immediate.
            </p>

            <div className="flex gap-3 justify-end pt-4.5 border-t border-slate-850 mt-4">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4.5 py-2 text-xs font-bold bg-red-500 hover:bg-red-450 text-white rounded-xl shadow transition"
                id="dialog-confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
