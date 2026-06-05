/** Contact Picker API — Chrome Android, pas Safari iOS. */
type ContactPickerEntry = {
  tel?: string[];
  name?: string[];
};

type ContactPickerNavigator = Navigator & {
  contacts?: {
    select: (
      properties: ("tel" | "name")[],
      options?: { multiple?: boolean }
    ) => Promise<ContactPickerEntry[]>;
  };
};

export function isContactPickerSupported(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as ContactPickerNavigator;
  return typeof nav.contacts?.select === "function";
}

export async function pickPhoneFromContacts(): Promise<string | null> {
  const nav = navigator as ContactPickerNavigator;
  if (!nav.contacts?.select) return null;

  const contacts = await nav.contacts.select(["tel", "name"], {
    multiple: false,
  });
  const entry = contacts[0];
  const raw = entry?.tel?.[0];
  return raw?.trim() ?? null;
}
