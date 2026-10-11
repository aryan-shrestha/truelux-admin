import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { signIn, signOut } from "../repositories/auth.repository";

// Each sign-in starts from an empty cache, so nothing of another staff member's
// session in this tab survives.
export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: signIn, onSuccess: () => queryClient.clear() });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: signOut,
    // Leave the signed-in screens before clearing, or they refetch without a token.
    onSuccess: async () => {
      await navigate({ to: "/login" });
      queryClient.clear();
    },
  });
}
