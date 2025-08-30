
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/Card';
import Button from '../components/Button';
import { generateText } from '../services/aiService';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [bioError, setBioError] = useState('');

  if (!user) {
    return null; // Or a loading spinner
  }

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    setBioError('');
    try {
      const bio = await generateText(user.email);
      updateUser({ bio });
    } catch (err: any) {
      setBioError(err.message || 'Failed to generate bio. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingBio(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card title="Your Profile">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Address</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Account Status</h3>
            <p className={`mt-1 text-sm font-semibold ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.isVerified ? 'Verified' : 'Verification Pending'}
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">AI Generated Bio</h3>
            {user.bio ? (
              <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{user.bio}</p>
            ) : (
              <p className="mt-2 text-gray-500 dark:text-gray-400 italic">No bio generated yet. Add an API key in settings to enable this feature.</p>
            )}
            {bioError && <p className="mt-2 text-sm text-red-500">{bioError}</p>}
            <div className="mt-4">
              <Button onClick={handleGenerateBio} isLoading={isGeneratingBio} variant="secondary">
                {user.bio ? 'Regenerate Bio with AI' : 'Generate Bio with AI'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;