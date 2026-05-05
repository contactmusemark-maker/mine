import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const PHOTO_KEY = "@me_ammu/ammu_photo";
const NAME_KEY = "@me_ammu/ammu_name";

export function useProfile() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("Ammu");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, n] = await Promise.all([
        AsyncStorage.getItem(PHOTO_KEY),
        AsyncStorage.getItem(NAME_KEY),
      ]);
      if (p) setPhoto(p);
      if (n) setName(n);
      setLoaded(true);
    })();
  }, []);

  const updatePhoto = useCallback(async (uri: string) => {
    setPhoto(uri);
    await AsyncStorage.setItem(PHOTO_KEY, uri);
  }, []);

  const updateName = useCallback(async (newName: string) => {
    setName(newName);
    await AsyncStorage.setItem(NAME_KEY, newName);
  }, []);

  return { photo, name, updatePhoto, updateName, loaded };
}
