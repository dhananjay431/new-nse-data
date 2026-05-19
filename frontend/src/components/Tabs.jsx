import { useState } from "react";

export default function Tabs({ tabs, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activePanel = tabs.find((t) => t.id === activeTab);

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4 border-b border-slate-200 dark:border-slate-700 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-600"
                : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panel */}
      <div className="tab-panel">{activePanel?.content}</div>
    </div>
  );
}
