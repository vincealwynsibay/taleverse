import Navbar from "@/components/Navbar";
import SubscriptionItem from "@/components/SubscriptionItem";
import { getPlans } from "@/lib/actions/stripe.action";

import { checkUser } from "@/lib/actions/common";
import Test from "@/components/Test";
const getUser = async () => {
  "use server";
  const user = await checkUser();
  if (!user.success || !user.data) {
    throw new Error("User not found");
  }
  return user;
};
export default async function Page() {
  const plans = await getPlans();
  const user = await getUser();

  if (!plans.data) {
    return null;
  }

  return (
    <div>
      <Navbar />
      {plans.data.map((plan) => (
        <SubscriptionItem key={plan.id} plan={plan} />
      ))}
      <Test stripeCustomerId={user.data.stripeCustomerId} />
    </div>
  );
}
