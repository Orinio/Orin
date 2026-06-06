'use client';

import { useState } from 'react';
import { useVision, useProofVerification } from '@/hooks/use-ai';

interface CertificateVerifierProps {
  onVerified?: (result: any) => void;
  onRejected?: (reason: string) => void;
}

export function CertificateVerifier({ onVerified, onRejected }: CertificateVerifierProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [expectedIssuer, setExpectedIssuer] = useState('');
  const [result, setResult] = useState<any>(null);
  const { analyze, isAnalyzing, error: visionError } = useVision();
  const { verify, isVerifying, error: verifyError } = useProofVerification();

  const handleVerify = async () => {
    if (!imageUrl.trim()) return;

    // First analyze the image
    const analysis = await analyze(imageUrl, 'Extract all certificate information from this image.');
    
    if (analysis) {
      // Check if it looks like a valid certificate
      const certInfo = {
        content: analysis.content,
        tokensUsed: analysis.tokensUsed
      };

      // Verify with expected issuer if provided
      if (expectedIssuer) {
        const verifyResult = await verify(imageUrl, 'certificate');
        if (verifyResult) {
          const isVerified = verifyResult.toolCalls.some(
            tc => tc.result.success && tc.result.data?.exists === true
          );

          setResult({
            verified: isVerified,
            certificateInfo: certInfo,
            analysis: verifyResult.answer
          });

          if (isVerified) {
            onVerified?.(certInfo);
          } else {
            onRejected?.('Certificate could not be verified');
          }
        }
      } else {
        // Just return the analysis
        setResult({
          verified: null,
          certificateInfo: certInfo,
          analysis: analysis.content
        });
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="text-lg font-semibold mb-4">Certificate Verification</h3>
      
      <div className="space-y-4">
        {/* Image URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certificate Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/certificate.jpg"
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Expected Issuer (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Issuer (Optional)
          </label>
          <input
            type="text"
            value={expectedIssuer}
            onChange={(e) => setExpectedIssuer(e.target.value)}
            placeholder="e.g., Coursera, AWS, Google"
            className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Preview */}
        {imageUrl && (
          <div className="border rounded-lg p-2">
            <img
              src={imageUrl}
              alt="Certificate preview"
              className="max-h-48 mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={!imageUrl.trim() || isAnalyzing || isVerifying}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? 'Analyzing Image...' : isVerifying ? 'Verifying...' : 'Verify Certificate'}
        </button>

        {/* Error Display */}
        {(visionError || verifyError) && (
          <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
            {visionError || verifyError}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.verified === true ? 'bg-green-50 border border-green-200' :
            result.verified === false ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center mb-2">
              {result.verified === true && (
                <span className="text-green-600 font-semibold">✓ Verified</span>
              )}
              {result.verified === false && (
                <span className="text-red-600 font-semibold">✗ Not Verified</span>
              )}
              {result.verified === null && (
                <span className="text-gray-600 font-semibold">Analysis Complete</span>
              )}
            </div>

            <div className="text-sm space-y-2">
              <p className="font-medium">Extracted Information:</p>
              <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border">
                {typeof result.certificateInfo?.content === 'string' 
                  ? result.certificateInfo.content 
                  : JSON.stringify(result.certificateInfo, null, 2)}
              </pre>

              {result.analysis && (
                <>
                  <p className="font-medium mt-3">AI Analysis:</p>
                  <p className="text-gray-700">{result.analysis}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
