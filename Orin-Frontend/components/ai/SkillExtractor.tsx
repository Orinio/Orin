'use client';

import { useState } from 'react';
import { useSkillExtraction, useEmbedding } from '@/hooks/use-ai';

interface SkillExtractorProps {
  onSkillsExtracted?: (skills: string[]) => void;
  onSimilarityCalculated?: (similarity: number) => void;
}

export function SkillExtractor({ onSkillsExtracted, onSimilarityCalculated }: SkillExtractorProps) {
  const [text, setText] = useState('');
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [similarityText, setSimilarityText] = useState('');
  const [similarityResult, setSimilarityResult] = useState<number | null>(null);
  const { extractSkills, isExtracting, error: extractError } = useSkillExtraction();
  const { generate, isGenerating, error: embedError } = useEmbedding();

  const handleExtract = async () => {
    if (!text.trim()) return;

    const result = await extractSkills(text);
    
    if (result) {
      // Parse skills from the answer
      try {
        const parsed = JSON.parse(result.answer);
        const skills = parsed.skills?.map((s: any) => s.name) || [];
        setExtractedSkills(skills);
        onSkillsExtracted?.(skills);
      } catch {
        // If not JSON, try to extract skills from text
        const skillMatch = result.answer.match(/skills?[:\s]*([\w\s,]+)/i);
        if (skillMatch) {
          const skills = skillMatch[1].split(',').map(s => s.trim()).filter(Boolean);
          setExtractedSkills(skills);
          onSkillsExtracted?.(skills);
        }
      }
    }
  };

  const handleCalculateSimilarity = async () => {
    if (!text.trim() || !similarityText.trim()) return;

    // Generate embeddings for both texts
    const [emb1, emb2] = await Promise.all([
      generate(text),
      generate(similarityText)
    ]);

    if (emb1 && emb2) {
      // Calculate cosine similarity
      const similarity = cosineSimilarity(emb1.embedding, emb2.embedding);
      const percentage = Math.round(similarity * 100);
      setSimilarityResult(percentage);
      onSimilarityCalculated?.(percentage);
    }
  };

  // Helper function to calculate cosine similarity
  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-6">
      <h3 className="text-lg font-semibold">Skill Analysis</h3>

      {/* Skill Extraction Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Extract Skills from Text</h4>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your resume, project description, or any text to extract skills from..."
          className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />

        <button
          onClick={handleExtract}
          disabled={!text.trim() || isExtracting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isExtracting ? 'Extracting...' : 'Extract Skills'}
        </button>

        {/* Extracted Skills Display */}
        {extractedSkills.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-2">Extracted Skills:</p>
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {extractError && (
          <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
            {extractError}
          </div>
        )}
      </div>

      {/* Similarity Calculation Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium text-gray-700">Calculate Text Similarity</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Text 1</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="First text..."
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Text 2</label>
            <textarea
              value={similarityText}
              onChange={(e) => setSimilarityText(e.target.value)}
              placeholder="Second text..."
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        <button
          onClick={handleCalculateSimilarity}
          disabled={!text.trim() || !similarityText.trim() || isGenerating}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {isGenerating ? 'Calculating...' : 'Calculate Similarity'}
        </button>

        {/* Similarity Result */}
        {similarityResult !== null && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-800">
              Similarity Score: <span className="text-lg">{similarityResult}%</span>
            </p>
            <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${similarityResult}%` }}
              />
            </div>
          </div>
        )}

        {embedError && (
          <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
            {embedError}
          </div>
        )}
      </div>
    </div>
  );
}
