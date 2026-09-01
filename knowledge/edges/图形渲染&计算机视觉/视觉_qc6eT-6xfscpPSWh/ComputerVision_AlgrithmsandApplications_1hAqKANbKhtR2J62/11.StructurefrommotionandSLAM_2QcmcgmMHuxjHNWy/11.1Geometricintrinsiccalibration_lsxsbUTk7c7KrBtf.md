# 11.1 Geometric intrinsic calibration



remind what is intrinsics:

1. focal length (f_x, f_y)
2. principal point (c_x, cy)
3. distortion coefficients (optional, non-linear)

$ \begin{bmatrix}
  f_x & 0 & c_x \\
  0 & f_y & c_y \\
  0 & 0 & 1
\end{bmatrix} $





1. the computation of the internal (instrinsic) camera calibration parameters can occur simultaneously with the estimation of the (extrinsic) pose of the camera with respect to a known calibration target
2. Insome applications, you can use the EXIF tags associated with a JPEG imageto obtain a rough estimate of a camera's focal length and hense to initialize iterative estimation algorithms



> 更新: 2025-02-15 14:25:39  
> 原文: <https://www.yuque.com/viruspc/el3mi0/tt1q1xvwsib58l5i>