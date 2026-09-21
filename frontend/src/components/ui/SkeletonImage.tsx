"use client";

import React from "react";
import { ProgressiveImage, ProgressiveImageProps } from "./ProgressiveImage";

export type SkeletonImageProps = ProgressiveImageProps;

export const SkeletonImage: React.FC<SkeletonImageProps> = (props) => {
  return <ProgressiveImage {...props} />;
};

export default SkeletonImage;
