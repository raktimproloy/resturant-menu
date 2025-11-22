

const CategorySelector = ({menuCategories, selectedCategory, setSelectedCategory }) => (
  <div className="flex overflow-x-auto py-2 space-x-3 sm:space-x-4 scrollbar-hide">
    {menuCategories.map((category) => (
      <button
        key={category.key}
        onClick={() => setSelectedCategory(category.key)}
        className={`
          flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition duration-200 ease-in-out
          ${selectedCategory === category.key
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }
        `}
      >
        {category.label}
      </button>
    ))}
  </div>
);

export default CategorySelector;