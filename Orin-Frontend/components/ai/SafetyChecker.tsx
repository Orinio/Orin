'use client';

import { useState } from 'react';
import { useSafetyCheck } from '@/hooks/use-ai';

interface SafetyCheckerProps {
  onCheckComplete?: (result: { isSafe: boolean; details: any }) => void;
}

export function SafetyChecker({ onCheckComplete }: SafetyCheckerProps) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const { check, isChecking, error } = useSafetyCheck();

  const handleCheck = async () => {
    if (!text.trim()) return;

    const safetyResult = await check(text);
    
    if (safetyResult) {
      setResult(safetyResult);
      onCheckComplete?.({
        isSafe: safetyResult.isSafe,
        details: safetyResult
      });
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Content Safety Check</h3>
      
      <div className="space-y-4">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content to Check
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to check for safety..."
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>

        {/* Check Button */}
        <button
          onClick={handleCheck}
          disabled={!text.trim() || isChecking}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Safety'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.isSafe ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center mb-3">
              {result.isSafe ? (
                <>
                  <span className="text-green-600 text-2xl mr-2">✓</span>
                  <span className="text-green-800 font-semibold text-lg">Safe Content</span>
                </>
              ) : (
                <>
                  <span className="text-red-600 text-2xl mr-2">✗</span>
                  <span className="text-red-800 font-semibold text-lg">Unsafe Content</span>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded p-2 border">
                <p className="font-medium text-gray-700">User Safety</p>
                <p className={result.userSafety === 'safe' ? 'text-green-600' : 'text-red-600'}>
                  {result.userSafety}
                </p>
              </div>
              <div className="bg-white rounded p-2 border">
                <p className="font-medium text-gray-700">Response Safety</p>
                <p className={result.responseSafety === 'safe' ? 'text-green-600' : 'text-red-600'}>
                  {result.responseSafety}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
