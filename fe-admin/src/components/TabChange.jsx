const TabChange = ({ activeTab, onTabChange }) => {
    const tabs = [
      { id: 'chat', label: 'Chat', icon: '💬' },
      { id: 'users', label: 'Users', icon: '👥' },
      { id: 'announce', label: 'Announce', icon: '📢' }
    ];
  
    return (
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  export default TabChange;