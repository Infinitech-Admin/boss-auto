// data/gallery-media.ts
//
// Mock media for the vehicle detail gallery: 1 long video + 2 short clips + 10 photos.
// Images are real Unsplash photos (swap the IDs for your own shoot whenever ready).
// Videos point at Google's public sample-video bucket as stand-ins for real footage —
// replace `src`/`poster` with your CDN assets when you have them.

export type GalleryMediaType = "image" | "video";

export type GalleryMedia = {
    type: GalleryMediaType;
    src: string;
    alt: string;
    /** Only for videos: poster frame shown before playback / while loading. */
    poster?: string;
    /** Only for videos: rough length bucket, used to decide autoplay/controls behavior. */
    length?: "short" | "long";
    /** Optional human-readable duration label, e.g. "0:14" or "3:42". */
    duration?: string;
};

const galleryImagePool = [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1552616953-e7bb4b8dea9c?auto=format&fit=crop&w=1600&q=80",
];

export const showroomGalleryMedia: GalleryMedia[] = buildCarGalleryMedia("Showroom");

export function buildCarGalleryMedia(carName: string): GalleryMedia[] {
    const imageSlides = galleryImagePool.map((src, index) => ({
        type: "image" as const,
        src,
        alt: `${carName} gallery photo ${index + 1}`,
    }));

    return [
        {
            type: "video",
            src: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            poster: galleryImagePool[7],
            alt: `${carName} full walkthrough`,
            length: "long",
            duration: "9:56",
        },
        {
            type: "video",
            src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            poster: galleryImagePool[3],
            alt: `${carName} exterior walkaround`,
            length: "short",
            duration: "0:15",
        },
        {
            type: "video",
            src: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
            poster: galleryImagePool[6],
            alt: `${carName} road clip`,
            length: "short",
            duration: "0:15",
        },
        ...imageSlides,
    ];
}
