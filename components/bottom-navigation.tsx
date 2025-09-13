"use client"

import type React from "react"
import { JumpsIcon } from "@/components/icons/jumps-icon"
import { WorkJumpsIcon } from "@/components/icons/work-jumps-icon"
import { SummaryIcon } from "@/components/icons/summary-icon"
import { SettingsIcon } from "@/components/icons/settings-icon"
import type { IconProps } from "@/types/ui"

interface NavigationTab {
  id: string
  label: string
  icon: React.FC<IconProps>
}

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tabId: string) => void
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: NavigationTab[] = [
    { id: "jumps", label: "Jumps", icon: JumpsIcon },
    { id: "work", label: "Work Jumps", icon: WorkJumpsIcon },
    { id: "summary", label: "Summary", icon: SummaryIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <IconComponent
                  size={24}
                  className={`mb-1 ${activeTab === tab.id ? "text-blue-600" : "text-gray-500"}`}
                />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
