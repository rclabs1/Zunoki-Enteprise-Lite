'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useTheme } from 'next-themes'
import { ProtectedRoute } from '@/components/protected-route'
import { useTrackPageView } from '@/hooks/use-track-page-view'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'

export default function SettingsPage() {
  useTrackPageView('Settings')
  const { setTheme } = useTheme()

  const [notificationPrefs, setNotificationPrefs] = useState({
    weeklyReports: true,
    campaignAlerts: true,
    newFeatures: false,
  })

  const handleNotificationChange = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleDeleteAccount = () => {
    // In a real app, you would call an API to delete the user account
    toast({
      title: 'Account Deletion Requested',
      description: 'Your account is scheduled for deletion. This is a mock action.',
      variant: 'destructive',
    })
  }

  return (
    <ProtectedRoute>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Manage your account and application settings.</p>
        </div>

        {/* Appearance Settings */}
        <Card className="bg-[#1f1f1f] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Appearance</CardTitle>
            <CardDescription className="text-gray-400">
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <Label htmlFor="theme-mode" className="text-white">
                Theme Mode
              </Label>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setTheme('light')}>Light</Button>
                <Button variant="outline" onClick={() => setTheme('dark')}>Dark</Button>
                <Button variant="outline" onClick={() => setTheme('system')}>System</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-[#1f1f1f] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Notifications</CardTitle>
            <CardDescription className="text-gray-400">
              Choose how you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <div>
                <Label htmlFor="weekly-reports" className="text-white">Weekly Reports</Label>
                <p className="text-sm text-gray-400">Receive a summary of your campaign performance every week.</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={notificationPrefs.weeklyReports}
                onCheckedChange={() => handleNotificationChange('weeklyReports')}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <div>
                <Label htmlFor="campaign-alerts" className="text-white">Campaign Alerts</Label>
                <p className="text-sm text-gray-400">Get notified about important updates to your campaigns.</p>
              </div>
              <Switch
                id="campaign-alerts"
                checked={notificationPrefs.campaignAlerts}
                onCheckedChange={() => handleNotificationChange('campaignAlerts')}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
              <div>
                <Label htmlFor="new-features" className="text-white">New Feature Announcements</Label>
                <p className="text-sm text-gray-400">Stay up-to-date with the latest features and improvements.</p>
              </div>
              <Switch
                id="new-features"
                checked={notificationPrefs.newFeatures}
                onCheckedChange={() => handleNotificationChange('newFeatures')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card className="bg-[#1f1f1f] border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400">Account Management</CardTitle>
            <CardDescription className="text-gray-400">
              Destructive actions that cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-neutral-900 border-neutral-700 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

      </motion.div>
    </ProtectedRoute>
  )
}