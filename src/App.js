import React, { useRef, useState, useEffect } from 'react';
    import { View, StyleSheet, Image, TouchableOpacity, Text, ScrollView, Platform, ActivityIndicator } from 'react-native';
    import { WebView } from 'react-native-webview';
    import { launchImageLibrary } from 'react-native-image-picker';
    import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

    const App = () => {
      const webViewRef = useRef(null);
      const [response, setResponse] = useState('');
      const [imageUri, setImageUri] = useState(null);
      const [loading, setLoading] = useState(false);
      const prompt = "generate a high quality description/listing/price for the item in this image. do not include any additional commentary or ask questions, ect. , only respond with the listing and price based on the image i provide.";

      const fadeAnim = useSharedValue(0);

      const animatedStyle = useAnimatedStyle(() => {
        return {
          opacity: fadeAnim.value,
        };
      });

      useEffect(() => {
        fadeAnim.value = withTiming(1, { duration: 500, easing: Easing.ease });
      }, []);

      const handleSendPrompt = () => {
        setLoading(true);
        if (webViewRef.current) {
          let jsCode = `
            document.querySelector('textarea[placeholder="Send a message..."]').value = "${prompt}";
            document.querySelector('textarea[placeholder="Send a message..."]').dispatchEvent(new Event('input', { bubbles: true }));
          `;

          if (imageUri) {
            jsCode += `
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.style.display = 'none';
              document.body.appendChild(fileInput);

              fetch('${imageUri}')
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  fileInput.files = dataTransfer.files;

                  const event = new Event('change', { bubbles: true });
                  fileInput.dispatchEvent(event);

                  setTimeout(() => {
                    document.querySelector('button[aria-label="send"]').click();
                  }, 500);
                });
            `;
          } else {
            jsCode += `
              document.querySelector('button[aria-label="send"]').click();
            `;
          }
          webViewRef.current.injectJavaScript(jsCode);
        }
      };

      const handleWebViewMessage = (event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message && message.type === 'response') {
            setResponse(message.content);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          setLoading(false);
        }
      };

      const handleWebViewLoad = () => {
        if (webViewRef.current) {
          const hideElementsJS = `
            const style = document.createElement('style');
            style.innerHTML = \`
              header,
              [aria-label="Side panel"],
              [aria-label="Show sidebar"],
              [aria-label="Hide sidebar"] {
                display: none !important;
              }
            \`;
            document.head.appendChild(style);

            function observeMutations() {
              const targetNode = document.body;
              const config = { childList: true, subtree: true };

              const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                  if (mutation.type === 'childList') {
                    const responseElements = document.querySelectorAll('[data-message-author="assistant"]');
                    if (responseElements.length > 0) {
                      const lastResponse = responseElements[responseElements.length - 1];
                      const responseContent = lastResponse.textContent;
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'response', content: responseContent }));
                    }
                  }
                }
              });

              observer.observe(targetNode, config);
            }

            observeMutations();
          `;
          webViewRef.current.injectJavaScript(hideElementsJS);
        }
      };

      const handleImageUpload = async () => {
        const options = {
          mediaType: 'photo',
          includeBase64: false,
        };

        launchImageLibrary(options, (response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.error) {
            console.log('ImagePicker Error: ', response.error);
          } else {
            const uri = response.assets[0].uri;
            setImageUri(uri);
          }
        });
      };

      return (
        <Animated.View style={[styles.container, animatedStyle]}>
          <Text style={styles.title}>
            <Text style={styles.boldTitle}>Snap</Text>
            <Text style={styles.regularTitle}>-List</Text>
          </Text>
          <WebView
            ref={webViewRef}
            source={{ uri: 'https://chatgpt.com/g/g-7fcL2LktP-sell-me-this-pen/c/678a4f01-0008-800f-9f36-87cb6ffd060d' }}
            style={styles.webview}
            onLoad={handleWebViewLoad}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
          />
          <ScrollView style={styles.contentContainer}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            )}
            <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSendPrompt} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#1a1a1a" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.response}>{response}</Text>
          </ScrollView>
        </Animated.View>
      );
    };

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
      },
      title: {
        fontSize: 32,
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
        color: '#ffffff',
      },
      boldTitle: {
        fontWeight: 'bold',
        color: '#a6c97b',
      },
      regularTitle: {
        color: '#ffffff',
      },
      webview: {
        flex: 1,
      },
      contentContainer: {
        padding: 10,
      },
      response: {
        height: 100,
        borderColor: '#333333',
        borderWidth: 1,
        margin: 10,
        padding: 10,
        backgroundColor: '#262626',
        color: '#ffffff',
        borderRadius: 5,
      },
      imagePreview: {
        width: 150,
        height: 150,
        margin: 10,
        alignSelf: 'center',
        borderRadius: 5,
      },
      uploadButton: {
        backgroundColor: '#a6c97b',
        padding: 12,
        margin: 10,
        borderRadius: 5,
        alignItems: 'center',
      },
      uploadButtonText: {
        color: '#1a1a1a',
        fontWeight: 'bold',
      },
      submitButton: {
        backgroundColor: '#a6c97b',
        padding: 12,
        margin: 10,
        borderRadius: 5,
        alignItems: 'center',
      },
      submitButtonText: {
        color: '#1a1a1a',
        fontWeight: 'bold',
      },
    });

    export default App;
