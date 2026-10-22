
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  MEDIA_BASE_URL,
  fetchVehicle,
  hasPrice,
  resolveMediaUrl,
  type ApiError,
  type Vehicle,
} from "@/lib/api";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  jsonLdString,
} from "@/lib/site";

import CarDetailsClient from "./car-details-client";

type Props = { params: Promise<{ id: string }> };

// cache() = generateMetadata and the page share ONE fetch per request
const getVehicle = cache(async (id: string): Promise<Vehicle | null> => {
  try {
    const { data } = await fetchVehicle(id);
    return data ?? null;
  } catch (err) {
    if ((err as ApiError)?.status === 404) return null;
    throw err; // real outage -> 5xx so Google retries instead of dropping the page
  }
});

const fullName = (car: Vehicle) => {
  const name = car.name.trim();
  return name.includes(String(car.year)) ? name : `${car.year} ${name}`;
};

const carImages = (car: Vehicle): string[] => {
  const cover = car.image ? [resolveMediaUrl(car.image, MEDIA_BASE_URL)] : [];
  const gallery = (car.galleryMedia ?? [])
    .filter((m) => m.type === "image")
    .map((m) => resolveMediaUrl(m.src, MEDIA_BASE_URL));
  return [...cover, ...gallery].filter(Boolean);
};

const toKm = (m?: string) => {
  const n = parseInt((m ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
};

const clip = (s: string, max = 158) =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const car = await getVehicle(id);

  if (!car) {
    return { title: "Car not found", robots: { index: false, follow: false } };
  }

  const name = fullName(car);
  const sold = car.status === "sold";
  const specs = [
    car.mileage,
    car.transmission,
    car.fuel,
    hasPrice(car) ? `Price ${car.price}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const description = clip(
    `${name} for sale at ${SITE_NAME} in Muntinlupa City. ${specs}. ${car.description ?? ""}`
      .replace(/\s+/g, " ")
      .trim(),
  );

  const url = `/showroom/car/${id}`;
  const photo = carImages(car).slice(0, 1);
  const images = photo.length ? photo : [DEFAULT_OG_IMAGE.url];
  const title = `${name} for Sale in Muntinlupa`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Sold cars drop out of search (they stay visible on /sold-cars)
    robots: sold ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "en_PH",
      siteName: SITE_NAME,
      url,
      title: `${name} | ${SITE_NAME}`,
      description,
      images: images.map((src) => ({ url: src, alt: name })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${SITE_NAME}`,
      description,
      images,
    },
  };
}

export default async function CarPage({ params }: Props) {
  const { id } = await params;
  const car = await getVehicle(id);
  if (!car) notFound();

  const name = fullName(car);
  const url = absoluteUrl(`/showroom/car/${id}`);
  const km = toKm(car.mileage);

  const availability =
    car.status === "sold" || car.stock <= 0
      ? "https://schema.org/SoldOut"
      : car.status === "reserved"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Car",
        "@id": `${url}#car`,
        name,
        url,
        description: car.description || undefined,
        image: carImages(car).slice(0, 10),
        vehicleModelDate: String(car.year),
        bodyType: car.type || undefined,
        vehicleTransmission: car.transmission || undefined,
        fuelType: car.fuel || undefined,
        vehicleEngine: car.engine
          ? { "@type": "EngineSpecification", name: car.engine }
          : undefined,
        mileageFromOdometer: km
          ? { "@type": "QuantitativeValue", value: km, unitCode: "KMT" }
          : undefined,
        itemCondition: "https://schema.org/UsedCondition",
        offers: hasPrice(car)
          ? {
              "@type": "Offer",
              url,
              price: car.price_value,
              priceCurrency: "PHP",
              availability,
              itemCondition: "https://schema.org/UsedCondition",
              seller: { "@id": `${SITE_URL}/#organization` },
            }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Showroom",
            item: absoluteUrl("/showroom"),
          },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <CarDetailsClient initialCar={car} />
    </>
  );
}