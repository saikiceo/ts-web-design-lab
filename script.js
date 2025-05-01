'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // console.log('DOM Content Loaded. Initializing script...');

    // ----- 基本機能 -----
    const header = document.querySelector('.site-header');
    const getHeaderHeight = () => header ? header.offsetHeight : 0;

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            console.log('Anchor clicked:', this.getAttribute('href')); // デバッグログ追加
            const href = this.getAttribute('href');
            let targetElement = null;
            try {
                // hrefが '#' または空文字でなく、かつセレクタとして有効な場合のみ要素を探す
                if (href && href !== '#' && !href.startsWith('#') === false) {
                    targetElement = document.querySelector(href);
                    console.log('Target element:', targetElement); // デバッグログ追加
                }
            } catch (err) {
                console.warn(`Invalid selector: ${href}`);
                targetElement = null;
            }

            // スクロール対象外のリンク、またはターゲットが見つからない場合
            if (href === '#' || href === '' || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || !targetElement) {
                 if (document.querySelector('.global-nav')?.classList.contains('is-open')) {
                    closeMobileMenu();
                }
                 // モバイルメニュー内のリンク（ページ内リンク以外）の場合も閉じる
                 if (this.closest('.global-nav') && (href.startsWith('http') || !href.startsWith('#'))) {
                     closeMobileMenu();
                 }
                return; // 通常のリンク動作
            }

            // ページ内リンクの場合
            e.preventDefault();
            console.log('Default prevented.'); // デバッグログ追加
            const currentHeaderHeight = getHeaderHeight();
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - currentHeaderHeight;

            console.log('Attempting to scroll to:', targetPosition); // デバッグログ追加
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // アクセシビリティ：スクロール後にフォーカス移動
            setTimeout(() => {
                try {
                    // フォーカス可能な要素か確認 (tabindex=-1でもOK)
                    if (targetElement.hasAttribute('tabindex')) {
                         targetElement.focus({ preventScroll: true });
                    } else {
                         // 見出しなどにtabindex=-1を付与してフォーカス可能にするのがベストだが、
                         // ない場合は一時的に付与してフォーカスし、その後削除する（ややハッキー）
                         targetElement.setAttribute('tabindex', '-1');
                         targetElement.focus({ preventScroll: true });
                         targetElement.removeAttribute('tabindex');
                    }
                } catch (focusError) {
                    console.warn(`Could not focus on target element: ${href}`, focusError);
                }
            }, 500); // スクロール時間より少し長めに待つ

            if (document.querySelector('.global-nav')?.classList.contains('is-open')) {
                closeMobileMenu();
            }
        });
    });

    // モバイルメニュー開閉
    const menuToggle = document.querySelector('.menu-toggle');
    const globalNav = document.querySelector('.global-nav');
    const body = document.body;

    function openMobileMenu() {
        if(!menuToggle || !globalNav) return;
        menuToggle.classList.add('is-active');
        menuToggle.setAttribute('aria-expanded', 'true');
        globalNav.classList.add('is-open');
        body.classList.add('menu-open'); // bodyにクラスを追加してCSSでoverflow:hiddenを制御推奨
    }

    function closeMobileMenu() {
        if(!menuToggle || !globalNav) return;
        menuToggle.classList.remove('is-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        globalNav.classList.remove('is-open');
        body.classList.remove('menu-open');
    }

    if (menuToggle && globalNav) {
        menuToggle.addEventListener('click', (e) => {
             e.stopPropagation(); // クリックイベントの伝播停止
            if (globalNav.classList.contains('is-open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // メニュー外（オーバーレイ部分）クリックで閉じる
        body.addEventListener('click', (e) => {
             // メニューが開いていて、クリックされたのがナビゲーション自体やトグルボタン以外なら閉じる
             if (body.classList.contains('menu-open') && !globalNav.contains(e.target) && e.target !== menuToggle && !menuToggle.contains(e.target)) {
                closeMobileMenu();
             }
        });

        // Escapeキーでメニューを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && body.classList.contains('menu-open')) {
                closeMobileMenu();
            }
        });
    } else {
        console.warn('Menu toggle or global nav element not found.');
    }

    // フッターの年表示
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }


    // ----- インタラクション・演出 -----
    // 1. カスタムカーソル
    const cursor = document.querySelector('.custom-cursor');
    const isHoverableDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (cursor && isHoverableDevice) {
        // console.log('Initializing custom cursor...');
        cursor.style.opacity = '1'; // 初期表示
        body.style.cursor = 'none'; // 通常カーソル非表示

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        const speed = 0.1; // カーソルの追従速度

        // requestAnimationFrameで滑らかに追従
        function animateCursor() {
            const distX = mouseX - cursorX;
            const distY = mouseY - cursorY;
            cursorX += distX * speed;
            cursorY += distY * speed;
            // transformを直接更新
            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
            requestAnimationFrame(animateCursor);
        }
        animateCursor(); // ループ開始

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // ウィンドウ外に出た/入った時の表示制御
         document.addEventListener('mouseleave', () => {
            gsap.to(cursor, {opacity: 0, duration: 0.3}); // GSAPでフェードアウト
        });
         document.addEventListener('mouseenter', () => {
             gsap.to(cursor, {opacity: 1, duration: 0.3}); // GSAPでフェードイン
         });

        // ホバー対象要素
        const hoverTargets = 'a, button, input, textarea, .interactive-element, [role="button"], select';
        document.querySelectorAll(hoverTargets).forEach(el => {
            el.addEventListener('mouseenter', () => body.classList.add('link-hover'));
            el.addEventListener('mouseleave', () => body.classList.remove('link-hover'));
        });
    } else {
        console.log('Custom cursor disabled (not a hoverable device or element not found).');
        if(cursor) cursor.style.display = 'none'; // 念のため非表示
        body.style.cursor = 'auto'; // 通常カーソル表示を保証
    }


    // 2. スクロール連動アニメーション (GSAP ScrollTrigger)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        // console.log('Initializing GSAP animations...');
        gsap.registerPlugin(ScrollTrigger);

        // --- 汎用 .animated-element アニメーション ---
        // hero-descriptionは個別制御するので除外
        gsap.utils.toArray('.animated-element:not(.hero-description)').forEach(element => {
            gsap.fromTo(element,
                { opacity: 0, y: 50 }, // 開始状態
                {
                    opacity: 1, y: 0, // 終了状態
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: element,
                        start: 'top 85%', // 要素の上端がビューポートの85%の位置に来たら開始
                        toggleActions: 'play none none none', // スクロールイン時のみ再生
                        once: true, // アニメーションを1回だけ実行
                    }
                }
            );
        });

        // --- ヒーロー説明文 アニメーション ---
        const heroDesc = document.querySelector('.hero-description');
        const heroDescSpans = document.querySelectorAll('.hero-description span');
        if (heroDesc && heroDescSpans.length > 0) {
             // まず親要素をトリガーに
             ScrollTrigger.create({
                 trigger: heroDesc,
                 start: 'top 85%',
                 once: true,
                 // markers: true, // デバッグ用
                 onEnter: () => {
                     // console.log("Animating hero description spans..."); // ★デバッグ用ログ追加
                     // トリガーされたら中の span をアニメーションさせる
                     gsap.to(heroDescSpans, { // ターゲットを修正
                         opacity: 1,
                         y: 0,
                         duration: 0.8,
                         ease: 'power2.out',
                         stagger: 0.2, // 各行が0.2秒差でアニメーション
                     });
                 }
             });
        } else {
             console.warn("Hero description or its spans not found for animation.");
        }


        // ★★★ ヒーローキャッチコピー 3Dフリップアニメーション ★★★
        const heroCatchphraseChars = document.querySelectorAll('.hero-catchphrase .reveal-text-3d');
        if (heroCatchphraseChars.length > 0) {
            // console.log("Setting up hero catchphrase 3D animation..."); // ★デバッグ用ログ追加
            // GSAPで初期状態を設定 (CSSと重複しても問題ない)
            gsap.set(heroCatchphraseChars, {
                 opacity: 0,
                 rotationX: -90,
                 z: 50, // translateZ
                 scale: 0.8,
                 transformOrigin: "center center -25px"
            });

            // ページ読み込み完了後、少し遅れてアニメーション開始
             // DOMContentLoaded内で実行しているので、window.onloadを待つ必要は通常ない
             // delayでタイミングを調整
            gsap.to(heroCatchphraseChars, {
                opacity: 1,
                rotationX: 0,
                z: 0,
                scale: 1,
                duration: 0.8,     // アニメーション時間
                ease: 'power3.out', // イージング（動きの緩急）
                stagger: 0.05,     // 各文字間の遅延時間 (0.05くらいが標準的)
                delay: 0.5         // 全体のアニメーション開始遅延 (0.5秒)
            });
             // console.log("Hero catchphrase animation scheduled."); // ★デバッグ用ログ追加
        } else {
             console.warn("Hero catchphrase characters (.reveal-text-3d) not found for animation.");
        }
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★


        // --- セクションタイトル テキストアニメーション (一文字ずつ出現) ---
        // セクションタイトル内の .reveal-text をターゲットにする
        gsap.utils.toArray('.section-title .reveal-text').forEach((span) => {
            gsap.fromTo(span,
                { opacity: 0, y: 20, rotationX: -90, transformOrigin: "center 50% -10px" }, // 初期状態
                {
                    opacity: 1, y: 0, rotationX: 0, // 終了状態
                    duration: 0.5,
                    ease: 'power1.out',
                    stagger: 0.05, // 文字間のディレイ
                    scrollTrigger: {
                        trigger: span.closest('.section-title'), // 親のタイトル全体をトリガーに
                        start: 'top 80%', // トリガー開始位置
                        toggleActions: 'play none none none', // 動作
                        once: true // 一度だけ実行
                    }
                }
            );
        });

    } else {
        console.warn('GSAP or ScrollTrigger not loaded. Scroll animations disabled.');
        // GSAPがない場合のフォールバック
        document.querySelectorAll('.animated-element, .reveal-text, .reveal-text-3d').forEach(el => {
             el.style.opacity = '1';
             el.style.transform = 'none'; // transformもリセット
        });
         document.querySelectorAll('.hero-description span').forEach(span => {
             span.style.opacity = '1';
             span.style.transform = 'none';
         });
    }


    // 3. ヒーローセクションの3D回転キューブ (Three.js)
    const canvasContainer = document.getElementById('hero-3d-canvas');
    if (canvasContainer && typeof THREE !== 'undefined') {
        // console.log('Attempting to initialize Three.js...');
        // Intersection Observerで要素が表示されたら初期化
        const observer = new IntersectionObserver((entries, obs) => { // obs引数を追加
            if (entries[0].isIntersecting) {
                // console.log('Three.js container is visible, initializing...');
                initThreeJS(canvasContainer);
                obs.unobserve(canvasContainer); // 監視を解除
            }
        }, { threshold: 0.1 }); // 10%表示されたら
        observer.observe(canvasContainer); // 監視開始
    } else {
         if (!canvasContainer) console.warn('Three.js container (#hero-3d-canvas) not found.');
         if (typeof THREE === 'undefined') console.warn('Three.js library not loaded.');
    }


    // 4. FAQ アコーディオン機能
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        // console.log('Initializing FAQ accordion...');
         faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            if (!question || !answer) {
                console.warn('FAQ item missing question or answer.', item);
                return; // このアイテムはスキップ
            }

            // 初期状態設定
            if (question.getAttribute('aria-expanded') !== 'true') {
                answer.setAttribute('aria-hidden', 'true');
                if (typeof gsap !== 'undefined') { // GSAPがあれば高さ0に
                    gsap.set(answer, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0 });
                } else { // なければCSSで非表示
                     answer.style.display = 'none';
                }
            } else {
                 answer.setAttribute('aria-hidden', 'false'); // 最初から開いている場合
            }

            question.addEventListener('click', () => {
                const isExpanded = question.getAttribute('aria-expanded') === 'true';

                // GSAPが利用可能かチェック
                if (typeof gsap !== 'undefined') {
                    answer.hidden = false; // アニメーションのためにhidden解除
                    answer.removeAttribute('aria-hidden');

                    if (isExpanded) {
                        // 閉じるアニメーション
                        gsap.to(answer, {
                            height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0,
                            duration: 0.3, ease: 'power1.inOut',
                            onComplete: () => {
                                question.setAttribute('aria-expanded', 'false');
                                answer.setAttribute('aria-hidden', 'true');
                                // height: auto などのスタイルが残らないようにクリア
                                answer.style.cssText = '';
                                answer.hidden = true; // 最後にhiddenを戻す
                            }
                        });
                    } else {
                        // 開くアニメーション
                        question.setAttribute('aria-expanded', 'true');
                        answer.setAttribute('aria-hidden', 'false');
                        // 高さを計算するためにautoに設定し、アニメーション開始
                        gsap.set(answer, { height: 'auto', opacity: 1, paddingTop:'', paddingBottom:'', marginTop:'', marginBottom:'' }); // スタイルリセット
                        gsap.from(answer, { // fromでアニメーション
                            height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0,
                            duration: 0.4, ease: 'power1.inOut',
                            clearProps: "height,opacity,paddingTop,paddingBottom,marginTop,marginBottom" // アニメーション後にインラインスタイル削除
                        });
                    }
                } else {
                    // GSAPがない場合のシンプルなトグル
                    if (isExpanded) {
                        question.setAttribute('aria-expanded', 'false');
                        answer.setAttribute('aria-hidden', 'true');
                        answer.style.display = 'none';
                    } else {
                        question.setAttribute('aria-expanded', 'true');
                        answer.setAttribute('aria-hidden', 'false');
                        answer.style.display = ''; // display: block などに戻す
                    }
                }
            });
        });
    } else {
         console.warn('FAQ items not found.');
    }


    // 5. お問い合わせフォームのクライアントサイドバリデーションと送信処理
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm && formMessage) {
        // console.log('Initializing contact form...');
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // デフォルトの送信を常に停止
            formMessage.textContent = ''; // メッセージクリア
            formMessage.className = '';
            formMessage.style.display = 'none';

            let isValid = true;
            const requiredFields = contactForm.querySelectorAll('[required]');

            requiredFields.forEach(input => {
                // エラー表示をリセット
                const group = input.closest('.form-group') || input.closest('.privacy-consent');
                if (group) group.classList.remove('error');
                input.classList.remove('error');

                let fieldValid = true;
                if (input.type === 'checkbox') {
                    if (!input.checked) fieldValid = false;
                } else {
                    if (!input.value.trim()) fieldValid = false;
                    else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) fieldValid = false;
                }

                if (!fieldValid) {
                    isValid = false;
                    input.classList.add('error');
                    if (group) group.classList.add('error'); // 親要素にもエラークラス
                }
            });

            if (!isValid) {
                formMessage.textContent = 'エラー: * が付いている必須項目をご確認ください。';
                formMessage.className = 'error'; // errorクラスを付与
                formMessage.style.display = 'block';
                // 最初のエラーフィールドにフォーカス
                contactForm.querySelector('.error')?.focus();
                return; // 送信処理中断
            }

            // --- ここから実際の送信処理 (Formspreeへ送信) ---
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true; // 連打防止
            submitButton.textContent = '送信中...';

            const formData = new FormData(contactForm);
            const formUrl = contactForm.action; // フォームのaction属性からURLを取得

            fetch(formUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                // ボタンの状態を元に戻す
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;

                if (response.ok) {
                    // 成功時
                    formMessage.textContent = 'お問い合わせありがとうございます。';
                    formMessage.className = 'success'; // successクラスを付与
                    formMessage.style.display = 'block';
                    contactForm.reset(); // フォームリセット
                    // エラークラスも全て削除
                    contactForm.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
                    contactForm.querySelectorAll('.form-group.error, .privacy-consent.error').forEach(el => el.classList.remove('error'));
                } else {
                    // 失敗時
                    response.json().then(data => {
                        if (Object.hasOwnProperty.call(data, 'errors')) {
                            // Formspreeからのエラーメッセージがある場合
                            formMessage.textContent = data["errors"].map(error => error["message"]).join(", ");
                        } else {
                            formMessage.textContent = 'エラーが発生しました。もう一度お試しください。';
                        }
                        formMessage.className = 'error'; // errorクラスを付与
                        formMessage.style.display = 'block';
                    }).catch(() => {
                        // JSON形式でないエラーの場合
                        formMessage.textContent = 'エラーが発生しました。もう一度お試しください。';
                        formMessage.className = 'error'; // errorクラスを付与
                        formMessage.style.display = 'block';
                    });
                }
            })
            .catch(error => {
                // ネットワークエラーなど
                console.error('フォーム送信エラー:', error);
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                formMessage.textContent = '送信中にエラーが発生しました。ネットワーク接続をご確認ください。';
                formMessage.className = 'error'; // errorクラスを付与
                formMessage.style.display = 'block';
            });
        });

         // 入力/変更時にエラー表示をリアルタイムで解除
         contactForm.querySelectorAll('[required]').forEach(input => {
             const eventType = (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') ? 'change' : 'input';
             input.addEventListener(eventType, () => {
                 // エラークラスを削除
                 const group = input.closest('.form-group') || input.closest('.privacy-consent');
                 input.classList.remove('error');
                 if (group) group.classList.remove('error');
                 // エラーメッセージも消す（任意）
                 // if (formMessage.className === 'error') {
                 //     formMessage.textContent = '';
                 //     formMessage.className = '';
                 //     formMessage.style.display = 'none';
                 // }
             });
         });
    } else {
         if(!contactForm) console.warn('Contact form not found.');
         if(!formMessage) console.warn('Form message area not found.');
    }


}); // DOMContentLoaded end


// --- Three.js 初期化関数 (テキストテクスチャ版 - 変更なし) ---
function initThreeJS() {
    const container = document.getElementById('hero-3d-canvas');
    if (!container) return;

    // シーンの設定
    const scene = new THREE.Scene();

    // カメラの設定
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 高級感のあるマテリアル
    const navyMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a2a6c,      // ディープネイビー
        specular: 0xaaccff,   // 青みがかった反射光
        shininess: 90,        // 高い光沢
        reflectivity: 0.9     // 反射率高め
    });

    const goldMaterial = new THREE.MeshPhongMaterial({
        color: 0xd4af37,      // ゴールド
        specular: 0xffffaa,   // 黄色みがかった反射光
        shininess: 100,       // 非常に高い光沢
        reflectivity: 1       // 最大反射率
    });

    const purpleMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a3f6d,      // パープル
        specular: 0xaaaaff,   // 紫みがかった反射光
        shininess: 80,        // 高光沢
        reflectivity: 0.8     // 高反射率
    });

    // 複数のジオメトリを作成
    const mainCubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const smallCubeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

    // メッシュ作成
    const mainCube = new THREE.Mesh(mainCubeGeometry, navyMaterial);
    scene.add(mainCube);

    const smallCube = new THREE.Mesh(smallCubeGeometry, goldMaterial);
    smallCube.position.set(-2, 1.5, 0.5);
    scene.add(smallCube);

    const sphere = new THREE.Mesh(sphereGeometry, purpleMaterial);
    sphere.position.set(2, -1.5, -0.5);
    scene.add(sphere);

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x6a3093, 1);
    pointLight2.position.set(-5, -5, 2);
    scene.add(pointLight2);

    // 回転角度を保存するための変数
    let rotationX = 0;
    let rotationY = 0;

    function animate() {
        requestAnimationFrame(animate);

        // メインキューブの回転
        rotationX += 0.005;
        rotationY += 0.007;
        mainCube.rotation.x = rotationX;
        mainCube.rotation.y = rotationY;

        // 小さいキューブの回転
        smallCube.rotation.x += 0.02;
        smallCube.rotation.y += 0.01;

        // 球体の回転
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.02;

        // メインキューブのパルスエフェクト
        const pulseScale = 1 + 0.05 * Math.sin(Date.now() * 0.001);
        mainCube.scale.set(pulseScale, pulseScale, pulseScale);

        // 小さいキューブの動き
        smallCube.position.y = 1.5 + 0.2 * Math.sin(Date.now() * 0.002);

        // 球体の動き
        sphere.position.x = 2 + 0.3 * Math.cos(Date.now() * 0.001);

        renderer.render(scene, camera);
    }

    animate();

    // リサイズ対応
    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // マウス動きに応じたインタラクション
    function onMouseMove(event) {
        const rect = container.getBoundingClientRect();
        const mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        const mouseY = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        // カメラを少し動かして立体感を強調
        camera.position.x = mouseX * 0.5;
        camera.position.y = mouseY * 0.5;
        camera.lookAt(scene.position);
    }

    container.addEventListener('mousemove', onMouseMove);
}

// --- Perlinノイズ生成関数 (簡易版) ---
// 参考: https://mrl.nyu.edu/~perlin/noise/
// この実装はシンプル化されており、本格的な用途にはライブラリ利用を推奨します。
function PerlinNoise2D(x, y) {
    const floor = Math.floor;
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    const grad = (hash, x, y) => {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    };

    // プリミティブなハッシュテーブル (簡易版)
    const p = new Array(512);
    const permutation = [
        151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
        247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,170,242,166,114,86,16,246,
        236,12,161,116,174,211,189,171,130,100,179,184,1,48,208,72,101,72,101,145,209,107,155,5,255,2,77,198,7,225,
        140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
        57,177,33,88,237,149,56,87,170,242,166,114,86,16,246,236,12,161,116,174,211,189,171,130,100,179,184,1,48,208,
        72,101,145,209,107,155,5,255,2,77,198,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,
        75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,170,242,166,114,86,16,246,236,12,161,
        116,174,211,189,171,130,100,179,184,1,48,208,72,101,145,209,107,155,5,255,2,77,198
    ];
    for (let i = 0; i < 256; i++) p[i] = p[i + 256] = permutation[i];

    const X = floor(x) & 255;
    const Y = floor(y) & 255;
    x -= floor(x);
    y -= floor(y);

    const u = fade(x);
    const v = fade(y);

    const A = p[X] + Y;
    const AA = p[A] & 255;
    const AB = p[A + 1] & 255;
    const B = p[X + 1] + Y;
    const BA = p[B] & 255;
    const BB = p[B + 1] & 255;

    return lerp(lerp(grad(p[AA], x, y), grad(p[AB], x - 1, y), u),
               lerp(grad(p[BA], x, y - 1), grad(p[BB], x - 1, y - 1), u), v);
}

// --- ノイズ背景初期化関数 ---