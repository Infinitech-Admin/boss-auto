import ShowroomClient from "./showroom-client";
import { MEDIA_BASE_URL } from "@/lib/api";

export default function ShowroomPage() {
  return <ShowroomClient imageBaseUrl={MEDIA_BASE_URL} />;
}
