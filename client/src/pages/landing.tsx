import { Button } from "@/components/ui/button";
import { MapPin, Users, MessageCircle, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            LocalFeat
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Find activity partners within 1km of your location
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="px-8 py-3 text-lg"
          >
            Get Started - Sign In
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Partners</h3>
            <p className="text-gray-600">
              Connect with people nearby who share your interests and activities
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Direct Messaging</h3>
            <p className="text-gray-600">
              Chat privately with potential activity partners to plan meetups
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe & Secure</h3>
            <p className="text-gray-600">
              Content moderation and secure authentication keep the community safe
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-center mb-8">How it works</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Sign in to get started</h4>
                <p className="text-gray-600">Create your account to post and connect with others</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Share your location</h4>
                <p className="text-gray-600">Allow location access to see posts from people nearby</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Post or browse requests</h4>
                <p className="text-gray-600">Create posts for activities or respond to others within 1km</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Connect and meet up</h4>
                <p className="text-gray-600">Message potential partners and plan your activities together</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>A non-profit community platform sustained by donations</p>
        </div>
      </div>
    </div>
  );
}