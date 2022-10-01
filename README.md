# isel-leic-seginf-g03

> Computer Security project of group 03 from LEIC51D class.

The Portuguese version of this document is available [here](README.pt.md).

## Authors

- [André Páscoa](https://github.com/devandrepascoa)
- [André Jesus](https://github.com/andre-j3sus)
- [Nyckollas Brandão](https://github.com/Nyckoka)

Professor: Eng. José Simão

@ISEL<br>
Bachelor in Computer Science and Computer Engineering<br>
Computer Security - LEIC51D - Group 03<br>
Winter Semester of 2022/2023

---

---

## Exercises

### Exercise 1

#### 1.1

`xi = D(k)(yi) XOR RV`

#### 1.2

**a)** As RV is constant for all blocks, when applying RV with the XOR bit by bit operation, the patterns of the
original
text will remain. This means that although the bits change, if there are xi blocks with equal bits, there will be no
difference in their encrypted blocks.

**b)** When producing the cipher with the CBC operation mode, each encrypted block will need that the previous block has
already been encrypted, hence parallelization is not possible. In the case of deciphering, it can be parallelized
because there is no dependency. With this operation mode, as RV is constant, there is no dependency between the blocks,
that is, it is possible to parallelize the cipher and decipher.

---

### Exercise 2

In the approach described in RFC 4880, the message is encrypted with a symmetric algorithm, and the key used to encrypt
the message is encrypted with the recipient's public key. This way, the recipient can decrypt the message using their
private key, and the symmetric key to decrypt the message.

The use of this approach is justified by the fact that the symmetric algorithm is faster than the asymmetric algorithm.
The public key is not used to encrypt the message, as this process is much slower than the use of a symmetric key. As
the symmetric key is much smaller than the public key, the encryption and decryption process is much faster.

The process of decrypting a message is as follows:

1. The message is encrypted with a symmetric key;
2. The symmetric key is encrypted with the recipient's public key;
3. The message and the encrypted symmetric key are sent to the recipient;
4. The recipient decrypts the symmetric key with their private key;
5. The recipient decrypts the message with the decrypted symmetric key.

### Exercise 3

...

---

### Exercise 4

...

---

### Exercise 5

The objective of this exercise was to implement an application that performs cryptographic hash generation of files.
The application receives two arguments on the command line:

1. The name of the hash function (e.g. SHA-256, SHA-1, etc);
2. The file for which you want to get the hash.

In the resolution of this exercise, the `DigestInputStream` class of the JCA library was used to read the file and
generate the hash.

---

### Exercise 6

The sixth exercise is implemented in the [exercise6](./src/main/kotlin/exercise6) folder.

The objective of this exercise was to implement an application that encrypts and decrypts files with a hybrid scheme, as
described in exercise 2.
The application receives the option to encrypt (`-enc`) or decrypt (`-dec`) and the file to encrypt/decrypt on the
command line.

In encryption mode, the application also receives:

1. The file to encrypt;
2. The certificate with the public key of the recipient;
3. The file to save the encrypted message;
4. The file to save the encrypted symmetric key.

In decryption mode, the application receives:

1. The file to decrypt;
2. The file with the encrypted symmetric key;
3. The keystore with the private key of the recipient;
4. The keystore password;
5. The private key alias;
6. The file to save the decrypted message.

Two functions were implemented:

* `encrypt` - to encrypt a file;
* `decrypt` - to decrypt a file.