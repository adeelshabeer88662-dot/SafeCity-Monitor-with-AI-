import cv2
image_path = r"C:\Users\Administrator\.gemini\antigravity\brain\d22c5693-7ae9-4e4a-804f-7516198c8fa7\uploaded_image_1767320474146.png"
img = cv2.imread(image_path)
print(f"Image Shape: {img.shape}")
