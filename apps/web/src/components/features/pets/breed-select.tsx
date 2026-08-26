"use client";

import { Check, ChevronDown, List, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { PetSpecies } from "@petmosphere/domain";

const breedSuggestions: Record<PetSpecies, string[]> = {
  cat: [
    "American Bobtail",
    "Australian Mist",
    "Balinese",
    "Bengal",
    "Birman",
    "Bombay",
    "British Shorthair",
    "Burmese",
    "Burmilla",
    "Cornish Rex",
    "Devon Rex",
    "Domestic Longhair",
    "Domestic Shorthair",
    "Egyptian Mau",
    "Exotic Shorthair",
    "Maine Coon",
    "Moggy",
    "Norwegian Forest Cat",
    "Ocicat",
    "Oriental",
    "Persian",
    "Ragdoll",
    "Russian Blue",
    "Savannah",
    "Scottish Fold",
    "Selkirk Rex",
    "Siamese",
    "Siberian",
    "Singapura",
    "Somali",
    "Sphynx",
    "Tonkinese",
    "Turkish Van",
  ],
  dog: [
    "Afghan Hound",
    "Airedale Terrier",
    "Akita",
    "Alaskan Malamute",
    "American Staffordshire Terrier",
    "Australian Cattle Dog",
    "Australian Kelpie",
    "Australian Shepherd",
    "Australian Terrier",
    "Basenji",
    "Basset Hound",
    "Beagle",
    "Bernese Mountain Dog",
    "Border Collie",
    "Border Terrier",
    "Boxer",
    "Bull Arab",
    "Bull Terrier",
    "Cavalier King Charles Spaniel",
    "Cavoodle",
    "Chihuahua",
    "Cocker Spaniel",
    "Dachshund",
    "Dalmatian",
    "English Springer Spaniel",
    "French Bulldog",
    "German Shepherd",
    "Golden Retriever",
    "Great Dane",
    "Greyhound",
    "Groodle",
    "Hungarian Vizsla",
    "Irish Setter",
    "Italian Greyhound",
    "Jack Russell Terrier",
    "Japanese Spitz",
    "King Charles Spaniel",
    "Labradoodle",
    "Labrador Retriever",
    "Maltese",
    "Maremma Sheepdog",
    "Miniature Pinscher",
    "Miniature Schnauzer",
    "Neapolitan Mastiff",
    "Newfoundland",
    "Old English Sheepdog",
    "Pembroke Welsh Corgi",
    "Pomeranian",
    "Poodle",
    "Pug",
    "Rhodesian Ridgeback",
    "Rottweiler",
    "Samoyed",
    "Shar Pei",
    "Shih Tzu",
    "Siberian Husky",
    "Staffordshire Bull Terrier",
    "St Bernard",
    "Tibetan Spaniel",
    "Weimaraner",
    "West Highland White Terrier",
    "Whippet",
  ],
  other: [
    "Bearded Dragon",
    "Budgerigar",
    "Canary",
    "Cockatiel",
    "Ferret",
    "Finch",
    "Guinea Pig",
    "Hermit Crab",
    "Mouse",
    "Rabbit",
    "Rat",
    "Stick Insect",
  ],
};

/**
 * Custom breed combobox matching the Petmosphere Figma breed selector:
 * a 52px trigger with a leading list icon and trailing chevron, opening a
 * floating card with a search box, a scrollable breed list (active item
 * highlighted in brand orange with a check), a bottom fade, and a scrim.
 * Built on a real combobox pattern rather than a native <select> so the
 * dropdown always reopens with the full list (fixes the "can't re-edit the
 * breed" bug that the input+datalist had) while still allowing search.
 */
export function BreedSelect({
  disabled,
  id,
  onChange,
  species,
  value,
}: {
  disabled: boolean;
  id: string;
  onChange: (breed: string) => void;
  species: PetSpecies | "";
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerId = id;
  const listboxId = useId();

  const breeds = species ? breedSuggestions[species] : [];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? breeds.filter((breed) => breed.toLowerCase().includes(normalizedQuery))
    : breeds;

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function selectBreed(breed: string) {
    onChange(breed);
    close();
  }

  const placeholder = species ? "Select a breed" : "Choose a species first";

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${triggerId}-label`}
        className={`flex min-h-13 w-full items-center gap-3 rounded-xl border bg-[#fdf8f2] px-4 text-left transition-[border-color,box-shadow] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10 focus:outline-none ${
          disabled
            ? "border-[#f0e6d8] text-stone-400"
            : "border-[#f0e6d8] text-[#2d2d2d]"
        }`}
        disabled={disabled}
        id={triggerId}
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <List
          aria-hidden="true"
          className="size-5 shrink-0 text-stone-500"
          strokeWidth={2}
        />
        <span
          className={`flex-1 truncate text-[15px] font-medium ${
            value ? "text-[#2d2d2d]" : "text-stone-400"
          }`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 text-stone-500 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2}
        />
      </button>

      {open && !disabled ? (
        <>
          {/* scrim */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/[0.078]"
            onClick={close}
          />
          {/* dropdown card */}
          <div className="absolute top-full right-0 left-0 z-50 mt-2 flex max-h-[360px] flex-col overflow-hidden rounded-2xl border border-[#f0e6d8] bg-white shadow-[0px_16px_32px_-10px_rgba(0,0,0,0.078),0px_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2.5 border-b border-[#f0e6d8] bg-[#fff9f2] px-4 py-3">
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-stone-500"
                strokeWidth={2}
              />
              <input
                aria-label="Search breeds"
                autoFocus
                className="w-full bg-transparent text-sm text-[#2d2d2d] outline-none placeholder:text-stone-400"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search breeds"
                value={query}
              />
            </div>
            <div
              className="relative flex-1 overflow-y-auto"
              id={listboxId}
              role="listbox"
            >
              {filtered.length > 0 ? (
                filtered.map((breed) => {
                  const active = breed === value;
                  return (
                    <button
                      aria-selected={active}
                      className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] transition-[background-color,color] ${
                        active
                          ? "bg-[#ed802a]/[0.078] font-bold text-[#ed802a]"
                          : "text-[#2d2d2d] hover:bg-stone-50"
                      }`}
                      key={breed}
                      onClick={() => selectBreed(breed)}
                      role="option"
                      type="button"
                    >
                      <span className="truncate">{breed}</span>
                      {active ? (
                        <Check
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-[#ed802a]"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="px-4 py-3 text-sm text-stone-500">
                  No breeds match “{query}”.
                </p>
              )}
              {/* fade bottom */}
              <div
                aria-hidden="true"
                className="pointer-events-none sticky bottom-0 h-14 bg-gradient-to-b from-transparent to-white"
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
