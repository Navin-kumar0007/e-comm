import { getReturnRequests } from "@/app/actions/admin-returns";
import { ReturnsClient } from "./returns-client";

export default async function AdminReturnsPage() {
  const requests = await getReturnRequests();
  return <ReturnsClient requests={JSON.parse(JSON.stringify(requests))} />;
}
