'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote } from 'lucide-react';

interface Proverb {
  id: string;
  proverb_text: string;
  persona?: string;
  category: string;
  language: string;
  created_at: string;
  author?: string;
}

interface ProverbDisplayProps {
  isEnabled: boolean;
  selectedCategory: string;
  selectedLanguage: string;
  isLightTheme?: boolean;
}

export default function ProverbDisplay({
  isEnabled,
  selectedCategory,
  selectedLanguage,
  isLightTheme = false
}: ProverbDisplayProps) {
  const [currentProverb, setCurrentProverb] = useState<Proverb | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRotation, setLastRotation] = useState<number | null>(null);
  const [animationType, setAnimationType] = useState<'word' | 'letter' | 'whole'>('word');
  const [animationKey, setAnimationKey] = useState(0);

  // Split text into words for animation
  const renderAnimatedText = (text: string, baseClass: string) => {
    const words = text.split(' ');
    return words.map((word, index) => (
      <span
        key={index}
        className={`inline-block animate-word-fade ${baseClass}`}
        style={{
          animationDelay: `${index * 0.1}s`,
          marginRight: index < words.length - 1 ? '0.25rem' : '0'
        }}
      >
        {word}
      </span>
    ));
  };

  // Split text into letters for animation
  const renderLetterAnimatedText = (text: string, baseClass: string) => {
    const letters = text.split('');
    return letters.map((letter, index) => (
      <span
        key={index}
        className={`inline-block animate-letter-fade ${baseClass}`}
        style={{
          animationDelay: `${index * 0.05}s`,
          marginRight: letter === ' ' ? '0.25rem' : '0'
        }}
      >
        {letter === ' ' ? '\u00A0' : letter}
      </span>
    ));
  };

  // Render whole proverb with single animation
  const renderWholeAnimatedText = (text: string, baseClass: string) => {
    return (
      <span key={animationKey} className={`inline-block animate-whole-fade ${baseClass}`}>
        {text}
      </span>
    );
  };

  // Cycle through animation types
  const cycleAnimationType = useCallback(() => {
    setAnimationType(current => {
      switch (current) {
        case 'word': return 'letter';
        case 'letter': return 'whole';
        case 'whole': return 'word';
        default: return 'word';
      }
    });
    setAnimationKey(prev => prev + 1); // Force re-render for whole animation
  }, []);

  // Generate random rotation interval (5-10 hours)
  const getRotationInterval = useCallback(() => {
    const minHours = 5;
    const maxHours = 10;
    const randomHours = Math.random() * (maxHours - minHours) + minHours;
    return randomHours * 60 * 60 * 1000; // Convert to milliseconds
  }, []);

  // Fetch proverbs from API
  const fetchProverbs = useCallback(async () => {
    if (!isEnabled) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (selectedLanguage) {
        params.append('language', selectedLanguage);
      }

      const response = await fetch(`/api/quotes?${params.toString()}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        // Select random proverb from results
        const randomIndex = Math.floor(Math.random() * data.data.length);
        setCurrentProverb(data.data[randomIndex]);
        // Cycle to next animation type for variety
        cycleAnimationType();
      } else {
        setCurrentProverb(null);
      }
    } catch (error) {
      console.error('Failed to fetch proverbs:', error);
      setCurrentProverb(null);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, selectedCategory, selectedLanguage, cycleAnimationType]);

  // Initial load and category/language changes
  useEffect(() => {
    if (isEnabled) {
      fetchProverbs();
      setLastRotation(Date.now());
    }
  }, [isEnabled, selectedCategory, selectedLanguage, fetchProverbs]);

  // Set up rotation timer
  useEffect(() => {
    if (!isEnabled || !lastRotation) return;

    const interval = getRotationInterval();
    const timer = setTimeout(() => {
      fetchProverbs();
      setLastRotation(Date.now());
    }, interval);

    return () => clearTimeout(timer);
  }, [isEnabled, lastRotation, getRotationInterval, fetchProverbs]);

  // Don't render if disabled or no proverb
  if (!isEnabled || !currentProverb) {
    return null;
  }

  return (
    <div className="flex items-start gap-3">
      {/* Small quote icon */}
      <div className="flex-shrink-0 mt-1">
        <Quote className={`w-5 h-5 ${isLightTheme ? 'text-rose-600' : 'text-rose-400/70'}`} />
      </div>

      {/* Proverb content */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-3/4"></div>
          </div>
        ) : (
          <div className="space-y-1">
            <blockquote className={`text-lg font-bold leading-relaxed italic ${isLightTheme ? 'text-gray-900' : 'text-white'} font-serif`}>
              "{animationType === 'word' ? renderAnimatedText(currentProverb.proverb_text, '') :
                animationType === 'letter' ? renderLetterAnimatedText(currentProverb.proverb_text, '') :
                renderWholeAnimatedText(currentProverb.proverb_text, '')}"
            </blockquote>
            <cite className={`text-sm block font-medium ${isLightTheme ? 'text-gray-700' : 'text-white/70'}`}>
              — {currentProverb.author || 'Anonymous'}
            </cite>
          </div>
        )}
      </div>
    </div>
  );
}
