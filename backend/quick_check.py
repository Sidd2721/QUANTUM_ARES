print('db' in 'database')
# d-a-t-a-b-a-s-e
# looking for 'd','b' contiguous... 
# d is at 0, next is a (not b). So 'db' is NOT in 'database'
# Actually wait... let me check manually
s = 'database'
for i in range(len(s)-1):
    if s[i:i+2] == 'db':
        print(f'Found db at position {i}')
        break
else:
    print('db NOT found in database')
