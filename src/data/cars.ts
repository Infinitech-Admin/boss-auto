import { buildCarGalleryMedia, type GalleryMedia } from "./gallery-media";

export type Car = {
  id: number;
  name: string;
  year: string;
  type: "Sedan" | "SUV";
  mileage: string;
  engine: string;
  horsepower: string;
  transmission: string;
  price: string;
  location: string;
  fuel: string;
  badge: string;
  description: string;
  image: string;
  galleryMedia: GalleryMedia[];
};

export const cars: Car[] = [
  {
    id: 1,
    name: "BMW 5 Series",
    year: "2022",
    type: "Sedan",
    mileage: "18,500 km",
    engine: "3.0L Twin-Turbo",
    horsepower: "382 hp",
    transmission: "Automatic",
    price: "₱46,900",
    location: "Manila",
    fuel: "Petrol",
    badge: "Luxury Preferred",
    description:
      "A refined executive sedan with confident acceleration, a quiet cabin, and the kind of premium details that make every drive feel exceptional.",
    image: "/bmw-series-5.png",
    galleryMedia: buildCarGalleryMedia("BMW 5 Series"),
  },
  {
    id: 2,
    name: "Mercedes-Benz C-Class",
    year: "2023",
    type: "Sedan",
    mileage: "12,800 km",
    engine: "2.0L Turbo",
    horsepower: "255 hp",
    transmission: "Automatic",
    price: "₱41,200",
    location: "Taguig",
    fuel: "Petrol",
    badge: "Certified",
    description:
      "Designed for elegance and everyday comfort, this C-Class combines modern tech with muscular styling and responsive city-to-highway performance.",
    image: "/mercedes-c-class.png",
    galleryMedia: buildCarGalleryMedia("Mercedes-Benz C-Class"),
  },
  {
    id: 3,
    name: "Porsche Cayenne",
    year: "2023",
    type: "SUV",
    mileage: "9,600 km",
    engine: "3.0L V6",
    horsepower: "348 hp",
    transmission: "Automatic",
    price: "₱68,400",
    location: "Quezon City",
    fuel: "Petrol",
    badge: "Performance",
    description:
      "A bold luxury SUV with striking road presence, intelligent handling, and enough versatility for both weekend escapes and daily family driving.",
    image: "/porsche-cayenne.png",
    galleryMedia: buildCarGalleryMedia("Porsche Cayenne"),
  },
  {
    id: 4,
    name: "Range Rover Sport",
    year: "2022",
    type: "SUV",
    mileage: "21,300 km",
    engine: "3.0L Supercharged",
    horsepower: "355 hp",
    transmission: "Automatic",
    price: "₱63,800",
    location: "Cebu",
    fuel: "Petrol",
    badge: "Adventure Ready",
    description:
      "Luxury, capability, and commanding comfort combine in this versatile SUV, built to move from city streets to scenic routes with ease.",
    image: "/range-rover-sport.png",
    galleryMedia: buildCarGalleryMedia("Range Rover Sport"),
  },
];
