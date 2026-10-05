"use client";

import { Check, ChevronDown, List, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { PetSpecies } from "@petmosphere/domain";

export const OTHER_BREED = "others";

export function isSuggestedBreed(species: PetSpecies, breed: string) {
  return breedSuggestions[species].includes(breed);
}

const breedSuggestions: Record<PetSpecies, string[]> = {
  cat: [
    "American Bobtail",
    "American Curl",
    "American Shorthair",
    "Australian Mist",
    "Balinese",
    "Bengal",
    "Birman",
    "Bombay",
    "British Longhair",
    "British Shorthair",
    "Burmese",
    "Burmilla",
    "Cornish Rex",
    "Cymric",
    "Devon Rex",
    "Domestic Longhair",
    "Domestic Shorthair",
    "Egyptian Mau",
    "Exotic Shorthair",
    "Havana Brown",
    "Japanese Bobtail",
    "Korat",
    "LaPerm",
    "Maine Coon",
    "Manx",
    "Moggy",
    "Munchkin",
    "Nebelung",
    "Norwegian Forest Cat",
    "Ocicat",
    "Oriental",
    "Persian",
    "Peterbald",
    "Pixiebob",
    "Ragamuffin",
    "Ragdoll",
    "Russian Blue",
    "Savannah",
    "Scottish Fold",
    "Selkirk Rex",
    "Siamese",
    "Siberian",
    "Singapura",
    "Snowshoe",
    "Somali",
    "Sphynx",
    "Tonkinese",
    "Toyger",
    "Turkish Angora",
    "Turkish Van",
  ],
  dog: [
    "Afghan Hound",
    "Airedale Terrier",
    "Akita",
    "Alaskan Malamute",
    "American Bulldog",
    "American Cocker Spaniel",
    "American Staffordshire Terrier",
    "American Water Spaniel",
    "Anatolian Shepherd",
    "Australian Cattle Dog",
    "Australian Kelpie",
    "Australian Shepherd",
    "Australian Silky Terrier",
    "Australian Stumpy Tail Cattle Dog",
    "Australian Terrier",
    "Barbet",
    "Basenji",
    "Basset Fauve de Bretagne",
    "Basset Hound",
    "Beagle",
    "Bearded Collie",
    "Bedlington Terrier",
    "Belgian Malinois",
    "Belgian Tervuren",
    "Bernese Mountain Dog",
    "Bichon Frise",
    "Black and Tan Coonhound",
    "Bloodhound",
    "Border Collie",
    "Border Terrier",
    "Borzoi",
    "Boston Terrier",
    "Bouvier des Flandres",
    "Boxer",
    "Brittany",
    "Bull Arab",
    "Bull Mastiff",
    "Bull Terrier",
    "Cairn Terrier",
    "Canaan Dog",
    "Cane Corso",
    "Cardigan Welsh Corgi",
    "Cavalier King Charles Spaniel",
    "Cavoodle",
    "Chesapeake Bay Retriever",
    "Chihuahua",
    "Chinese Crested",
    "Chow Chow",
    "Clumber Spaniel",
    "Cocker Spaniel",
    "Coton de Tulear",
    "Dachshund",
    "Dalmatian",
    "Dandie Dinmont Terrier",
    "Doberman Pinscher",
    "Dogo Argentino",
    "Dogue de Bordeaux",
    "English Setter",
    "English Springer Spaniel",
    "English Toy Terrier",
    "Field Spaniel",
    "Finnish Lapphund",
    "Flat-Coated Retriever",
    "Fox Terrier",
    "French Bulldog",
    "German Pinscher",
    "German Shorthaired Pointer",
    "German Shepherd",
    "German Wirehaired Pointer",
    "Glen of Imaal Terrier",
    "Golden Retriever",
    "Great Dane",
    "Great Pyrenees",
    "Greyhound",
    "Groodle",
    "Hamiltonstovare",
    "Havanese",
    "Hungarian Vizsla",
    "Irish Setter",
    "Irish Terrier",
    "Irish Water Spaniel",
    "Irish Wolfhound",
    "Italian Greyhound",
    "Jack Russell Terrier",
    "Japanese Chin",
    "Japanese Spitz",
    "Keeshond",
    "King Charles Spaniel",
    "Koolie",
    "Kuvasz",
    "Labradoodle",
    "Labrador Retriever",
    "Lagotto Romagnolo",
    "Lakeland Terrier",
    "Leonberger",
    "Lhasa Apso",
    "Lowchen",
    "Maltese",
    "Manchester Terrier",
    "Maremma Sheepdog",
    "Mastiff",
    "Miniature American Shepherd",
    "Miniature Bull Terrier",
    "Miniature Dachshund",
    "Miniature Pinscher",
    "Miniature Poodle",
    "Miniature Schnauzer",
    "Neapolitan Mastiff",
    "Newfoundland",
    "Norfolk Terrier",
    "Norwegian Buhund",
    "Norwegian Elkhound",
    "Norwich Terrier",
    "Nova Scotia Duck Tolling Retriever",
    "Old English Sheepdog",
    "Otterhound",
    "Papillon",
    "Pekingese",
    "Pembroke Welsh Corgi",
    "Pharaoh Hound",
    "Pointer",
    "Polish Lowland Sheepdog",
    "Pomeranian",
    "Poodle",
    "Portuguese Water Dog",
    "Pug",
    "Puli",
    "Pyrenean Mountain Dog",
    "Pyrenean Shepherd",
    "Rat Terrier",
    "Rhodesian Ridgeback",
    "Rottweiler",
    "Saint Bernard",
    "Saluki",
    "Samoyed",
    "Schipperke",
    "Scottish Deerhound",
    "Scottish Terrier",
    "Shar Pei",
    "Shetland Sheepdog",
    "Shiba Inu",
    "Shih Tzu",
    "Siberian Husky",
    "Silky Terrier",
    "Skye Terrier",
    "Sloughi",
    "Soft Coated Wheaten Terrier",
    "Spaniel (American Water)",
    "Spanish Water Dog",
    "Spinone Italiano",
    "Staffordshire Bull Terrier",
    "Standard Poodle",
    "Stumpy Tail Cattle Dog",
    "Sussex Spaniel",
    "Swedish Vallhund",
    "Tibetan Mastiff",
    "Tibetan Spaniel",
    "Tibetan Terrier",
    "Toy Fox Terrier",
    "Toy Poodle",
    "Weimaraner",
    "Welsh Springer Spaniel",
    "Welsh Terrier",
    "West Highland White Terrier",
    "Wheaten Terrier",
    "Whippet",
    "Wire Fox Terrier",
    "Xoloitzcuintli",
    "Yorkshire Terrier",
  ],
  other: [
    "Abyssinian Guinea Pig",
    "Alexandrine Parrot",
    "Axolotl",
    "Ball Python",
    "Bearded Dragon",
    "Blue Tongue Lizard",
    "Budgerigar",
    "Canary",
    "Chinchilla",
    "Cockatiel",
    "Cockroach",
    "Corn Snake",
    "Crested Gecko",
    "Domestic Guinea Pig",
    "Donkey",
    "Ferret",
    "Finch",
    "Gecko",
    "Goat",
    "Goldfish",
    "Guinea Pig",
    "Hamster",
    "Hermit Crab",
    "Horse",
    "Lorikeet",
    "Lovebird",
    "Mouse",
    "Pet Bird",
    "Python",
    "Quail",
    "Rabbit",
    "Rat",
    "Sheep",
    "Shrimp",
    "Snail",
    "Snake",
    "Stick Insect",
    "Turtle",
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
  const [maxHeight, setMaxHeight] = useState<number>();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerId = id;
  const listboxId = useId();

  // Keep the dropdown card inside the viewport on small screens: cap it to the
  // space below the trigger (minus margin), falling back to 360px.
  useEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect)
      setMaxHeight(Math.max(160, window.innerHeight - rect.bottom - 16));
  }, [open]);

  const breeds = species ? breedSuggestions[species] : [];
  const normalizedQuery = query.trim().toLowerCase();
  const options = [...breeds, OTHER_BREED];
  const filtered = normalizedQuery
    ? options.filter((breed) =>
        (breed === OTHER_BREED ? "Others" : breed)
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : options;

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
  const displayValue = value === OTHER_BREED ? "Others" : value;

  return (
    <div className="relative" ref={rootRef}>
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
          {displayValue || placeholder}
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
          <div
            className="absolute top-full right-0 left-0 z-50 mt-2 flex flex-col overflow-hidden rounded-2xl border border-[#f0e6d8] bg-white shadow-[0px_16px_32px_-10px_rgba(0,0,0,0.078),0px_2px_8px_rgba(0,0,0,0.05)]"
            style={
              maxHeight ? { maxHeight: Math.min(maxHeight, 360) } : undefined
            }
          >
            <div className="flex items-center gap-2.5 border-b border-[#f0e6d8] bg-[#fff9f2] px-4 py-3">
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-stone-500"
                strokeWidth={2}
              />
              <input
                aria-label="Search breeds"
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
                      <span className="truncate">
                        {breed === OTHER_BREED ? "Others" : breed}
                      </span>
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
