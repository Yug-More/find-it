import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import { colors, spacing, typography } from "../../constants/theme";
import type { SelectedImage } from "../../types/report";
import { mimeTypeForFileName, validateSelectedImage } from "../../utils/imageValidation";
import { Button } from "../ui/Button";
import { ReportImage } from "./ReportImage";

type Props = {
  image: SelectedImage | null;
  imageUrl: string | null;
  disabled?: boolean;
  onChange: (image: SelectedImage | null, imageUrl: string | null) => void;
};

export function ImageField({ image, imageUrl, disabled = false, onChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const choosing = useRef(false);
  const [picking, setPicking] = useState(false);
  const preview = image?.uri ?? imageUrl;
  const hasPhoto = Boolean(preview);

  async function choosePhoto() {
    if (disabled || choosing.current) return;
    choosing.current = true;
    setPicking(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Photo library access is required to add an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName?.trim() || "photo.jpg";
      const selected: SelectedImage = {
        uri: asset.uri,
        mimeType: asset.mimeType || mimeTypeForFileName(fileName),
        fileName,
        fileSize: asset.fileSize ?? null,
      };
      const validationError = validateSelectedImage(selected);
      if (validationError) {
        setError(validationError);
        return;
      }
      onChange(selected, imageUrl);
    } catch {
      setError("The photo library could not be opened. Try again.");
    } finally {
      choosing.current = false;
      setPicking(false);
    }
  }

  function removePhoto() {
    setError(null);
    onChange(null, null);
  }

  return (
    <View style={styles.field}>
      <ReportImage uri={preview} label="Selected report photo" size={hasPhoto ? "hero" : "field"} />
      <Button
        label={hasPhoto ? "Replace photo" : "Add photo"}
        variant="outline"
        onPress={() => {
          void choosePhoto();
        }}
        disabled={disabled || picking}
      />
      {hasPhoto ? (
        <Button label="Remove photo" variant="text" onPress={removePhoto} disabled={disabled || picking} />
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.error,
  },
});
