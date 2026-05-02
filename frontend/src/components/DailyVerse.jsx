import React, { useMemo } from "react";
import { BookOpen } from "lucide-react";

const verses = [
  { text: "In the beginning, God created the heavens and the earth.", ref: "Genesis 1:1" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", ref: "John 3:16" },
  { text: "I can do all things through him who strengthens me.", ref: "Philippians 4:13" },
  { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
  { text: "Come to me, all who labor and are heavy laden, and I will give you rest.", ref: "Matthew 11:28" },
  { text: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", ref: "Romans 8:28" },
  { text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.", ref: "Jeremiah 29:11" },
  { text: "The steadfast love of the Lord never ceases; his mercies never come to an end.", ref: "Lamentations 3:22" },
  { text: "Rejoice always, pray without ceasing, give thanks in all circumstances.", ref: "1 Thessalonians 5:16-18" },
  { text: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.", ref: "Galatians 5:22-23" },
  { text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", ref: "Philippians 4:6" },
  { text: "The peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.", ref: "Philippians 4:7" },
  { text: "Cast all your anxiety on him because he cares for you.", ref: "1 Peter 5:7" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
  { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.", ref: "Isaiah 40:31" },
  { text: "When you pass through the waters, I will be with you; and through the rivers, they shall not overwhelm you.", ref: "Isaiah 43:2" },
  { text: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.", ref: "James 1:5" },
  { text: "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.", ref: "2 Corinthians 5:17" },
  { text: "Thy word is a lamp unto my feet, and a light unto my path.", ref: "Psalm 119:105" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", ref: "Matthew 6:33" },
  { text: "Let us not grow weary of doing good, for in due season we will reap, if we do not give up.", ref: "Galatians 6:9" },
  { text: "Commit your work to the Lord, and your plans will be established.", ref: "Proverbs 16:3" },
  { text: "Jesus Christ is the same yesterday and today and forever.", ref: "Hebrews 13:8" },
  { text: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", ref: "Joshua 1:9" },
  { text: "My grace is sufficient for you, for my power is made perfect in weakness.", ref: "2 Corinthians 12:9" },
  { text: "He heals the brokenhearted and binds up their wounds.", ref: "Psalm 147:3" },
  { text: "The name of the Lord is a strong tower; the righteous man runs into it and is safe.", ref: "Proverbs 18:10" },
  { text: "For we walk by faith, not by sight.", ref: "2 Corinthians 5:7" }
];

export default function DailyVerse() {
  const dailyVerse = useMemo(() => {
    // Math logic maps standard 1-31 dates to the zero-indexed array perfectly.
    const dayOfMonth = new Date().getDate(); 
    return verses[(dayOfMonth - 1) % verses.length];
  }, []);

  return (
    <div className="w-full mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center justify-center text-center transition-colors">
      <BookOpen className="text-red-500 mb-3" size={24} />
      <p className="text-lg sm:text-xl font-serif italic text-gray-800 dark:text-gray-200 leading-relaxed max-w-2xl px-4">
        "{dailyVerse.text}"
      </p>
      <span className="mt-3 text-xs sm:text-sm tracking-widest uppercase font-bold text-gray-400 dark:text-gray-500">
        {dailyVerse.ref}
      </span>
    </div>
  );
}
