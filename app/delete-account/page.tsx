'use client'

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-blue-600 text-2xl font-bold mb-6">
          🎯 Predictive Play
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b-2 border-blue-600 pb-2">
          Delete Your Predictive Play Account
        </h1>
        
        <p className="text-gray-700 mb-8">
          This page explains how to permanently delete your Predictive Play account and associated data. 
          Account deletion is immediate and cannot be undone.
        </p>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          How to Delete Your Account
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h3 className="font-semibold text-lg mb-2">Step 1: Open the Predictive Play App</h3>
            <p className="text-gray-700">
              Launch the Predictive Play app on your mobile device and ensure you're logged into your account.
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h3 className="font-semibold text-lg mb-2">Step 2: Go to Settings</h3>
            <p className="text-gray-700">
              Tap the "Settings" tab at the bottom of your screen (gear icon).
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h3 className="font-semibold text-lg mb-2">Step 3: Find Delete Account Option</h3>
            <p className="text-gray-700">
              Scroll down to the bottom of the Settings page and tap the red "Delete Account" button.
            </p>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
            <h3 className="font-semibold text-lg mb-2">Step 4: Confirm Deletion</h3>
            <p className="text-gray-700">
              Read the warning message carefully, then tap "Delete" to confirm. Your account will be permanently deleted immediately.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-8">
          <p className="text-yellow-800">
            <strong>⚠️ Important:</strong> Account deletion is permanent and cannot be undone. 
            You will lose access to all your predictions, chat history, and subscription benefits.
          </p>
        </div>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          What Data Gets Deleted
        </h2>
        
        <p className="text-gray-700 mb-4">
          When you delete your account, the following data is permanently removed from our servers:
        </p>
        
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border border-gray-300 px-4 py-2 text-left">Data Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Deletion Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Retention Period</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Profile Information (name, email, preferences)</td>
                <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Deleted Immediately</td>
                <td className="border border-gray-300 px-4 py-2">0 days</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">AI Predictions & Insights</td>
                <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Deleted Immediately</td>
                <td className="border border-gray-300 px-4 py-2">0 days</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Chat History with Professor Lock</td>
                <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Deleted Immediately</td>
                <td className="border border-gray-300 px-4 py-2">0 days</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">User Preferences & Settings</td>
                <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Deleted Immediately</td>
                <td className="border border-gray-300 px-4 py-2">0 days</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Authentication Data</td>
                <td className="border border-gray-300 px-4 py-2 text-green-600">✅ Deleted Immediately</td>
                <td className="border border-gray-300 px-4 py-2">0 days</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">Subscription Records</td>
                <td className="border border-gray-300 px-4 py-2 text-yellow-600">⚠️ Kept for Legal Compliance</td>
                <td className="border border-gray-300 px-4 py-2">7 years (tax/legal requirements)</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Anonymous Usage Analytics</td>
                <td className="border border-gray-300 px-4 py-2 text-yellow-600">⚠️ May Remain</td>
                <td className="border border-gray-300 px-4 py-2">Up to 2 years (aggregated, non-personal)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          Subscription Cancellation
        </h2>
        
        <p className="text-gray-700 mb-4">
          <strong>Important:</strong> Deleting your Predictive Play account does not automatically cancel your subscription. 
          If you have an active subscription, you must also:
        </p>
        
        <ul className="list-disc list-inside text-gray-700 mb-8 space-y-2">
          <li><strong>iOS Users:</strong> Cancel through Settings → Your Name → Subscriptions → Predictive Play</li>
          <li><strong>Android Users:</strong> Cancel through Google Play Store → Account → Subscriptions → Predictive Play</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          Partial Data Deletion
        </h2>
        
        <p className="text-gray-700 mb-8">
          We currently do not offer partial data deletion (deleting some data while keeping your account). 
          Account deletion is all-or-nothing. If you need specific data removed while keeping your account, 
          please contact us using the information below.
        </p>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          Alternative: Account Support
        </h2>
        
        <p className="text-gray-700 mb-4">
          If you're having issues with your account and considering deletion, we may be able to help resolve your concerns. 
          Consider reaching out to our support team first.
        </p>

        <div className="bg-green-50 border border-green-200 rounded p-6 mb-8">
          <h3 className="text-lg font-semibold text-green-800 mb-2">📧 Need Help?</h3>
          <p className="text-green-700 mb-2">
            If you need assistance with account deletion or have questions about data handling:
          </p>
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li><strong>Email:</strong> support@predictiveplay.com</li>
            <li><strong>App Support:</strong> Use the "Help & Support" option in Settings</li>
            <li><strong>Response Time:</strong> We typically respond within 24-48 hours</li>
          </ul>
        </div>

        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          Data Protection Rights
        </h2>
        
        <p className="text-gray-700 mb-4">
          Under applicable data protection laws (GDPR, CCPA, etc.), you have the right to:
        </p>
        <ul className="list-disc list-inside text-gray-700 mb-8 space-y-1">
          <li>Request access to your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data (exercised through account deletion)</li>
          <li>Object to processing of your data</li>
          <li>Request data portability</li>
        </ul>

        <hr className="my-8" />
        
        <p className="text-sm text-gray-500">
          Last updated: September 23, 2025 | Predictive Play by Reid Reusch | This page complies with Google Play Developer Program Policies
        </p>
      </div>
    </div>
  )
}
