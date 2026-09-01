# 1997 - Fast Subsequence Matching in Time-Series Databases

- [Main Contribution](#main-contribution)
- [Problem](#problem)
- [Method](#method)

---

# Main Contribution
**An indexing method for subsequence matching. **

The method has the following desirable features.

1. fast
2. space saving
3. dynamic
4. correct

# Problem
Accelerate the process of **searching for similar patterns**. Similarity queries can been classifed into two categories:

1. **Whole Mathing**.
2. **Subsequence Matching**. Given N data sequences S1, S2, ..., SN of arbitrary lengths, a query sequence Q and a tolerance \epsilon, we want to identify the data sequences Si (1 <= i<= N) that contain matching subsequences (i.e. subsequences with distance <= \epsilon from Q). Report those data sequences, along with the correct o sets within the data sequences that best match the query sequence. (We assume that we are given a function D(S, Q), which gives the distance of the sequences S and Q. For example, D() can be the Euclidean distance.)

注：Mathching是比较两条时序的distance，不考虑不等长数据和等长数据对齐不自然（不用DTW及相关变种），不是像shape search那样比较trend。

# Method
We present an efficient **indexing method **to locate 1- dimensional subsequences within a collection of sequences, such that the subsequences match a given (query) pattern within a specified tolerance.



The idea is to 1. map each data sequence into a small set of multidimensional rectangles in feature space. 2. Then, these rectangles can be readily indexed using traditional spatial access methods, like the R*-tree.



In more detail, we use a sliding window over the data sequence and extract its features; the result is a trail in feature space. We propose an ecient and e ective algorithm to divide such trails into sub-trails, which are subsequently represented by their Minimum Bounding Rectangles (MBRs). We also examine queries of varying lengths, and we show how to handle each case eciently.



> 更新: 2022-11-25 09:11:48  
> 原文: <https://www.yuque.com/viruspc/el3mi0/eomlrn8m10ag7317>