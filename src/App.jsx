import React, { useState, useEffect, useMemo } from 'react';
import { Book, Calendar, Star, Trash2, PenTool, BarChart3, Download, Filter, Plus, X, Search, Loader2, Quote, MinusCircle } from 'lucide-react';

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, type = "button" }) => {
  const baseStyle = "flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
    slate: "bg-slate-50 text-slate-700 ring-slate-600/20",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

// --- Main Application ---

export default function ReadingTracker() {
  // State
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('reading-insight-data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'rating'

  // Search API State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Form State
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    rating: 5,
    category: '인문학',
    review: '',
    scraps: [] // Array of strings
  });
  
  const [scrapInput, setScrapInput] = useState(''); // Temp input for a scrap

  // Categories based on user interests
  const categories = [
    { id: '인문학', label: '인문학', color: 'indigo' },
    { id: '철학/불교', label: '철학/불교', color: 'amber' },
    { id: '우주/과학', label: '우주/과학', color: 'blue' },
    { id: '경제/투자', label: '경제/투자', color: 'emerald' },
    { id: '마케팅/데이터', label: '마케팅/데이터', color: 'purple' },
    { id: '에세이/소설', label: '에세이/소설', color: 'rose' },
    { id: '기타', label: '기타', color: 'slate' },
  ];

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('reading-insight-data', JSON.stringify(books));
  }, [books]);

  // Google Books API Search Function
  const searchBooks = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTerm)}&maxResults=5`);
      if (!response.ok) throw new Error('검색 실패');
      const data = await response.json();
      
      if (data.items) {
        setSearchResults(data.items);
      } else {
        setSearchResults([]); // No results
      }
    } catch (err) {
      setSearchError('책 정보를 불러오지 못했습니다. 직접 입력해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  // Select Book from Search Results
  const handleSelectBook = (bookItem) => {
    const info = bookItem.volumeInfo;
    const authors = info.authors ? info.authors.join(', ') : '';
    
    // Auto-categorization Logic
    let detectedCategory = '기타'; // Default fallback
    const apiCategories = info.categories || [];
    const title = info.title || '';
    
    const keywords = {
      '철학/불교': ['Philosophy', 'Religion', 'Buddhism', 'Meditation', '철학', '종교', '불교', '명상', 'Zen', 'Mindfulness'],
      '우주/과학': ['Science', 'Physics', 'Astronomy', 'Space', 'Technology', 'Math', 'Computer', 'Biology', '과학', '우주', '물리', '천문', '기술', '수학', '생물'],
      '경제/투자': ['Business', 'Economics', 'Finance', 'Investment', 'Money', 'Stock', 'Wealth', '경제', '경영', '투자', '재테크', '주식', '부자', '금융'],
      '마케팅/데이터': ['Marketing', 'Data', 'Analytics', 'Statistics', 'Branding', 'Trend', '마케팅', '데이터', '브랜드', '기획', '통계', '트렌드'],
      '에세이/소설': ['Fiction', 'Literature', 'Essay', 'Novel', 'Poetry', 'Drama', '소설', '에세이', '문학', '시', '수필', '산문'],
      '인문학': ['Humanities', 'History', 'Social', 'Psychology', 'Art', 'Culture', '인문', '역사', '사회', '심리', '예술', '교양', '문화']
    };

    const textToCheck = (title + ' ' + apiCategories.join(' ')).toLowerCase();

    let found = false;
    for (const [catId, keyArr] of Object.entries(keywords)) {
      if (keyArr.some(k => textToCheck.includes(k.toLowerCase()))) {
        detectedCategory = catId;
        found = true;
        break;
      }
    }

    setNewBook(prev => ({
      ...prev,
      title: info.title,
      author: authors,
      category: detectedCategory
    }));
    
    setSearchResults([]); 
    setSearchTerm(''); 
  };

  // Handler: Add Scrap
  const handleAddScrap = () => {
    if (!scrapInput.trim()) return;
    setNewBook(prev => ({
      ...prev,
      scraps: [...prev.scraps, scrapInput.trim()]
    }));
    setScrapInput('');
  };

  const handleRemoveScrap = (index) => {
    setNewBook(prev => ({
      ...prev,
      scraps: prev.scraps.filter((_, i) => i !== index)
    }));
  };

  // Handler: Add Book
  const handleAddBook = (e) => {
    e.preventDefault();
    if (!newBook.title.trim()) return;

    const bookEntry = {
      id: Date.now(),
      ...newBook,
      createdAt: new Date().toISOString()
    };

    setBooks([bookEntry, ...books]);
    setNewBook({
      title: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      rating: 5,
      category: '인문학',
      review: '',
      scraps: []
    });
    setScrapInput('');
    setIsFormOpen(false);
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handler: Delete Book
  const handleDeleteBook = (id) => {
    if (window.confirm('정말 이 기록을 삭제하시겠습니까?')) {
      setBooks(books.filter(book => book.id !== id));
    }
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    const headers = ['제목,저자,카테고리,읽은날짜,평점,감상평,스크랩'];
    const rows = books.map(book => {
      const scrapsStr = book.scraps ? book.scraps.join(' | ') : '';
      return `"${book.title}","${book.author}","${book.category}","${book.date}",${book.rating},"${book.review.replace(/"/g, '""')}","${scrapsStr.replace(/"/g, '""')}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reading_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived State (Statistics)
  const stats = useMemo(() => {
    const total = books.length;
    const avgRating = total > 0 ? (books.reduce((acc, cur) => acc + Number(cur.rating), 0) / total).toFixed(1) : 0;
    
    // Monthly stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthCount = books.filter(b => b.date.startsWith(currentMonth)).length;

    // Favorite Category
    const catCount = books.reduce((acc, cur) => {
      acc[cur.category] = (acc[cur.category] || 0) + 1;
      return acc;
    }, {});
    const favCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b, '-');

    return { total, avgRating, thisMonthCount, favCat };
  }, [books]);

  // Filter & Sort
  const filteredBooks = books
    .filter(book => filterCategory === 'All' || book.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Book size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Reading Insight</h1>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" onClick={handleExportCSV} className="hidden sm:flex text-sm">
                <Download size={16} className="mr-1"/> 데이터 내보내기
             </Button>
            <Button onClick={() => setIsFormOpen(true)} icon={Plus}>
              기록하기
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Dashboard Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none">
            <div className="flex items-center gap-2 opacity-80 mb-1">
              <Book size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">총 독서량</span>
            </div>
            <div className="text-3xl font-bold">{stats.total}<span className="text-base font-normal opacity-80 ml-1">권</span></div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">이번 달</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.thisMonthCount}<span className="text-base font-normal text-gray-400 ml-1">권</span></div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Star size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">평균 평점</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgRating}</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <BarChart3 size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">선호 분야</span>
            </div>
            <div className="text-xl font-bold text-gray-900 truncate">{stats.favCat === '-' ? '데이터 없음' : stats.favCat}</div>
          </Card>
        </section>

        {/* Filters & Content */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              <button 
                onClick={() => setFilterCategory('All')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === 'All' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                전체
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterCategory === cat.id ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500 w-full sm:w-auto justify-end">
              <span className="flex items-center gap-1"><Filter size={14}/> 정렬:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="date">최신순</option>
                <option value="rating">별점순</option>
              </select>
            </div>
          </div>

          {/* Book List */}
          <div className="space-y-4">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <PenTool size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">아직 기록된 책이 없습니다</h3>
                <p className="text-gray-500 mt-1">우측 상단 '기록하기' 버튼을 눌러 첫 독서 기록을 남겨보세요.</p>
              </div>
            ) : (
              filteredBooks.map((book) => {
                const categoryColor = categories.find(c => c.id === book.category)?.color || 'slate';
                return (
                  <Card key={book.id} className="hover:shadow-md transition-shadow duration-200 group">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Left: Info */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge color={categoryColor}>{book.category}</Badge>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar size={10} />
                                {book.date}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{book.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{book.author}</p>
                          </div>
                          
                          {/* Rating display for mobile alignment */}
                          <div className="flex sm:hidden items-center bg-yellow-50 px-2 py-1 rounded text-yellow-700 font-bold text-sm">
                            <Star size={12} className="fill-yellow-500 text-yellow-500 mr-1" />
                            {book.rating}
                          </div>
                        </div>

                        {/* Review Content */}
                        {book.review && (
                          <div className="mt-4 bg-gray-50 rounded-lg p-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {book.review}
                          </div>
                        )}

                        {/* Scraps (Quotes) Section */}
                        {book.scraps && book.scraps.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                              <Quote size={12} /> 문장 스크랩
                            </h4>
                            <ul className="space-y-2">
                              {book.scraps.map((scrap, idx) => (
                                <li key={idx} className="text-sm text-gray-600 italic bg-indigo-50/50 p-2 rounded border-l-2 border-indigo-200">
                                  "{scrap}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions & Rating (Desktop) */}
                      <div className="flex sm:flex-col justify-between items-end gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-4 sm:min-w-[100px]">
                         <div className="hidden sm:flex flex-col items-end">
                            <div className="flex items-center gap-1 text-yellow-500 mb-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < book.rating ? "fill-yellow-500" : "text-gray-200 fill-gray-200"} />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-gray-400">{book.rating} / 5.0</span>
                         </div>

                         <button 
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-auto sm:ml-0"
                            title="삭제하기"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Input Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">새로운 책 기록</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              
              {/* Search Section */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">책 검색으로 자동 입력</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="책 제목을 검색해보세요 (예: 코스모스)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
                  />
                  <Button onClick={searchBooks} disabled={isSearching} className="whitespace-nowrap px-3 py-2 text-sm">
                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  </Button>
                </div>
                
                {searchError && <p className="text-xs text-red-500 mt-2">{searchError}</p>}
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden max-h-40 overflow-y-auto shadow-inner">
                    {searchResults.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => handleSelectBook(item)}
                        className="p-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
                      >
                         <div className="w-8 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                            {item.volumeInfo.imageLinks?.smallThumbnail ? (
                              <img src={item.volumeInfo.imageLinks.smallThumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400"><Book size={12}/></div>
                            )}
                         </div>
                         <div className="min-w-0">
                           <p className="text-sm font-bold text-gray-800 truncate">{item.volumeInfo.title}</p>
                           <p className="text-xs text-gray-500 truncate">{item.volumeInfo.authors?.join(', ')}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">또는 직접 입력</span>
                  <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleAddBook} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">책 제목</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="예: 코스모스"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">저자</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="예: 칼 세이건"
                      value={newBook.author}
                      onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        value={newBook.category}
                        onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">읽은 날짜</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newBook.date}
                        onChange={(e) => setNewBook({...newBook, date: e.target.value})}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">평점 (1-5)</label>
                      <div className="flex gap-2 items-center h-[42px]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewBook({...newBook, rating: star})}
                            className="focus:outline-none transition-transform active:scale-110"
                          >
                            <Star 
                              size={24} 
                              className={`${star <= newBook.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          </button>
                        ))}
                      </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">짧은 독후감 / 메모</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] resize-none"
                    placeholder="이 책에서 느낀 점이나 기억하고 싶은 문구를 기록하세요."
                    value={newBook.review}
                    onChange={(e) => setNewBook({...newBook, review: e.target.value})}
                  ></textarea>
                </div>

                {/* Scrap Input Section */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Quote size={14}/> 기억하고 싶은 문장 (스크랩)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="문장을 입력하고 추가 버튼을 누르세요."
                      value={scrapInput}
                      onChange={(e) => setScrapInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddScrap())}
                    />
                    <Button onClick={handleAddScrap} variant="secondary" className="whitespace-nowrap" type="button">
                      추가
                    </Button>
                  </div>
                  
                  {/* Scraps List */}
                  {newBook.scraps && newBook.scraps.length > 0 && (
                    <ul className="space-y-2 mt-3">
                      {newBook.scraps.map((scrap, index) => (
                        <li key={index} className="flex justify-between items-start text-sm bg-white p-2 rounded border border-gray-100 shadow-sm">
                          <span className="text-gray-600 italic mr-2">"{scrap}"</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveScrap(index)} 
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                          >
                            <MinusCircle size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="pt-2">
                  <Button className="w-full py-3 text-lg" onClick={handleAddBook}>
                    기록 저장하기
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
