ref = 'version0_gray/id012_00C_C.png'
one = imread('version0_gray/id001_00C_C.png')
two = imread('version0_gray/id014_00C_C.png')
one_match = imhistmatch(one, ref)
two_match = imhistmatch(two, ref)

imwrite(one_match, 'ONE_MATCH.png')
imwrite(two_match, 'TWO_MATCH.png')