(() => {
    const canvas = document.getElementById('lobbyCanvas');
    if (!canvas || !window.BABYLON) return;

    const engine = new BABYLON.Engine(canvas, true, { antialias: true, adaptToDeviceRatio: true });
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.025, 0.075, 0.055, 1);

    // Same camera philosophy as the game: follow the player, rotate with RMB,
    // zoom with the wheel, and never let normal left-clicks rotate the camera.
    const camera = new BABYLON.ArcRotateCamera(
        'lobbyCamera', Math.PI, Math.PI / 3, 16,
        new BABYLON.Vector3(0, 2, 2), scene
    );
    camera.lowerRadiusLimit = 7;
    camera.upperRadiusLimit = 24;
    camera.lowerBetaLimit = 0.15;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelPrecision = 40;
    camera.inputs.removeByType('ArcRotateCameraPointersInput');
    camera.inputs.addMouseWheel();
    camera.attachControl(canvas, false);

    let isRotating = false;
    let activePointerId = null;
    let lastX = 0;
    let lastY = 0;
    const cameraSensitivity = 0.0045;

    canvas.addEventListener('contextmenu', event => event.preventDefault());
    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 2) return;
        event.preventDefault();
        isRotating = true;
        activePointerId = event.pointerId;
        lastX = event.clientX;
        lastY = event.clientY;
        try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
    });
    window.addEventListener('pointermove', event => {
        if (!isRotating || event.pointerId !== activePointerId) return;
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        lastX = event.clientX;
        lastY = event.clientY;
        camera.alpha -= dx * cameraSensitivity;
        camera.beta = Math.max(camera.lowerBetaLimit, Math.min(camera.upperBetaLimit, camera.beta - dy * cameraSensitivity));
    });
    const stopCamera = event => {
        if (!isRotating) return;
        if (event.button === 2 || event.pointerId === activePointerId) {
            isRotating = false;
            try { if (activePointerId !== null) canvas.releasePointerCapture(activePointerId); } catch (_) {}
            activePointerId = null;
        }
    };
    window.addEventListener('pointerup', stopCamera);
    window.addEventListener('pointercancel', stopCamera);
    window.addEventListener('blur', () => { isRotating = false; activePointerId = null; });

    const hemi = new BABYLON.HemisphericLight('lobbyHemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 1.0;
    const sun = new BABYLON.DirectionalLight('lobbySun', new BABYLON.Vector3(-0.5, -1, 0.4), scene);
    sun.position = new BABYLON.Vector3(10, 25, -10);
    sun.intensity = 0.8;

    const mat = (name, color, emissive = null) => {
        const m = new BABYLON.StandardMaterial(name, scene);
        m.diffuseColor = BABYLON.Color3.FromHexString(color);
        m.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        if (emissive) m.emissiveColor = BABYLON.Color3.FromHexString(emissive);
        return m;
    };

    const jungle = mat('jungle', '#173b2c');
    const grass = mat('grass', '#286044');
    const stone = mat('stone', '#31443c');
    const wood = mat('wood', '#3b2618');
    const gold = mat('gold', '#fbbf24', '#5c3d00');
    const yellow = mat('toucanYellow', '#facc15', '#3d3000');
    const cyan = mat('avatarCyan', '#22d3ee', '#063c45');
    const purple = mat('avatarPurple', '#a78bfa', '#25124c');
    const red = mat('avatarRed', '#fb7185', '#4a111c');
    const green = mat('avatarGreen', '#4ade80', '#0b3c20');
    const warmLight = mat('hangingLight', '#fff4bf', '#fff0a8');

    const floor = BABYLON.MeshBuilder.CreateGround('lobbyFloor', { width: 42, height: 30 }, scene);
    floor.material = grass;
    const island = BABYLON.MeshBuilder.CreateCylinder('lobbyIsland', { diameter: 30, height: 0.9, tessellation: 64 }, scene);
    island.position.y = -0.5;
    island.material = jungle;

    // Trees around the boundary.
    for (let i = 0; i < 18; i++) {
        const angle = i / 18 * Math.PI * 2;
        const r = 15 + (i % 3) * 1.4;
        const tree = BABYLON.MeshBuilder.CreateCylinder('treeTrunk' + i, { diameter: 0.55, height: 3 + (i % 3) }, scene);
        tree.position = new BABYLON.Vector3(Math.cos(angle) * r, 1.5, Math.sin(angle) * r * 0.68);
        tree.material = stone;
        const crown = BABYLON.MeshBuilder.CreateSphere('treeCrown' + i, { diameter: 3.4 + (i % 2), segments: 12 }, scene);
        crown.position = tree.position.add(new BABYLON.Vector3(0, 2.5, 0));
        crown.material = jungle;
    }

    // Wooden beams make the lobby feel like a built jungle camp.
    const beamPositions = [
        new BABYLON.Vector3(-10, 7, -7), new BABYLON.Vector3(10, 7, -7),
        new BABYLON.Vector3(-10, 7, 7), new BABYLON.Vector3(10, 7, 7)
    ];
    beamPositions.forEach((p, i) => {
        const post = BABYLON.MeshBuilder.CreateCylinder('lobbyPost' + i, { diameter: 0.38, height: 8, tessellation: 10 }, scene);
        post.position = p;
        post.material = wood;
    });
    const roofBeam1 = BABYLON.MeshBuilder.CreateBox('roofBeam1', { width: 21, height: 0.35, depth: 0.45 }, scene);
    roofBeam1.position = new BABYLON.Vector3(0, 7, -7);
    roofBeam1.material = wood;
    const roofBeam2 = roofBeam1.clone('roofBeam2');
    roofBeam2.position.z = 7;

    // Hanging lanterns / lights.
    const lightPositions = [
        new BABYLON.Vector3(-7, 5.8, -6.7), new BABYLON.Vector3(0, 5.4, -6.7),
        new BABYLON.Vector3(7, 5.8, -6.7), new BABYLON.Vector3(-7, 5.8, 6.7),
        new BABYLON.Vector3(0, 5.4, 6.7), new BABYLON.Vector3(7, 5.8, 6.7),
        new BABYLON.Vector3(0, 6.0, 0)
    ];
    lightPositions.forEach((p, i) => {
        const rope = BABYLON.MeshBuilder.CreateCylinder('lightRope' + i, { diameter: 0.035, height: 1.3, tessellation: 8 }, scene);
        rope.position = p.add(new BABYLON.Vector3(0, 0.65, 0));
        rope.material = wood;
        const lantern = BABYLON.MeshBuilder.CreateSphere('lantern' + i, { diameter: 0.42, segments: 12 }, scene);
        lantern.position = p;
        lantern.material = warmLight;
        const point = new BABYLON.PointLight('lanternLight' + i, p.clone(), scene);
        point.diffuse = new BABYLON.Color3(1, 0.78, 0.35);
        point.specular = new BABYLON.Color3(1, 0.8, 0.4);
        point.intensity = 0.55;
        point.range = 7;
    });

    const makeBlob = (name, position, material, scale = 1) => {
        const root = new BABYLON.TransformNode(name, scene);
        root.position = position.clone();
        const body = BABYLON.MeshBuilder.CreateSphere(name + 'Body', { diameter: 2, segments: 20 }, scene);
        body.parent = root;
        body.scaling = new BABYLON.Vector3(1, 0.8, 1);
        body.material = material;
        const eyeL = BABYLON.MeshBuilder.CreateSphere(name + 'EyeL', { diameter: 0.22 }, scene);
        const eyeR = eyeL.clone(name + 'EyeR');
        eyeL.parent = root; eyeR.parent = root;
        eyeL.position = new BABYLON.Vector3(-0.34, 0.27, -0.82);
        eyeR.position = new BABYLON.Vector3(0.34, 0.27, -0.82);
        const eyeMat = mat(name + 'EyeMat', '#101010');
        eyeL.material = eyeMat; eyeR.material = eyeMat;
        root.scaling = new BABYLON.Vector3(scale, scale, scale);
        return root;
    };

    const player = makeBlob('lobbyPlayer', new BABYLON.Vector3(0, 1, 2), yellow, 1.15);
    const roam = { t: 0 };

    const avatars = [
        { id: 'ranger', name: 'RANGER', title: 'Canopy Scout', description: 'Fast, fearless and always looking for the next shortcut.', color: cyan, pos: new BABYLON.Vector3(-7, 1, -2) },
        { id: 'moss', name: 'MOSS', title: 'Jungle Veteran', description: 'Knows every rock, route and dangerous jump in the canopy.', color: green, pos: new BABYLON.Vector3(7, 1, -2) },
        { id: 'ember', name: 'EMBER', title: 'Speedrunner', description: 'Lives for perfect dashes and brutally fast records.', color: red, pos: new BABYLON.Vector3(-5, 1, 7) },
        { id: 'nova', name: 'NOVA', title: 'Trial Master', description: 'A mysterious challenger waiting for someone to beat the leaderboard.', color: purple, pos: new BABYLON.Vector3(5, 1, 7) }
    ];

    avatars.forEach(a => {
        a.mesh = makeBlob(a.id, a.pos, a.color, 1.0);
        a.mesh.metadata = { avatar: a };
        a.mesh.getChildMeshes().forEach(m => m.metadata = { avatar: a });
    });

    // Central PLAY pedestal.
    const pedestal = BABYLON.MeshBuilder.CreateCylinder('playPedestal', { diameter: 3.6, height: 0.6, tessellation: 32 }, scene);
    pedestal.position = new BABYLON.Vector3(0, 0.35, -2.8);
    pedestal.material = gold;
    const playRing = BABYLON.MeshBuilder.CreateTorus('playRing', { diameter: 4.2, thickness: 0.12, tessellation: 48 }, scene);
    playRing.position = pedestal.position.add(new BABYLON.Vector3(0, 0.4, 0));
    playRing.material = gold;

    const panel = document.getElementById('avatarPanel');
    const title = document.getElementById('avatarTitle');
    const subtitle = document.getElementById('avatarSubtitle');
    const description = document.getElementById('avatarDescription');
    const interactPrompt = document.getElementById('interactPrompt');
    let nearbyAvatar = null;

    function showAvatar(a) {
        title.textContent = a.name;
        subtitle.textContent = a.title;
        description.textContent = a.description;
        panel.classList.add('open');
        nearbyAvatar = null;
        interactPrompt.classList.remove('visible');
    }
    window.closeAvatarPanel = () => panel.classList.remove('open');

    // Avatars are fixed in the world. Interaction is proximity + E.
    window.addEventListener('keydown', event => {
        if (event.key.toLowerCase() !== 'e' || !nearbyAvatar) return;
        event.preventDefault();
        showAvatar(nearbyAvatar);
    });

    // Keep mouse/touch interaction as a convenience, but E is the primary interaction.
    scene.onPointerObservable.add(info => {
        if (info.type !== BABYLON.PointerEventTypes.POINTERPICK) return;
        const avatar = info.pickInfo?.pickedMesh?.metadata?.avatar;
        if (avatar) showAvatar(avatar);
    });

    document.getElementById('playButton').addEventListener('click', () => location.href = 'game.html');
    document.getElementById('leaderboardButton').addEventListener('click', async () => {
        await loadLeaderboard();
        document.getElementById('leaderboardPanel').classList.add('open');
    });
    document.getElementById('statsButton').addEventListener('click', async () => {
        await loadStats();
        document.getElementById('statsPanel').classList.add('open');
    });
    document.getElementById('closeLeaderboard').onclick = () => document.getElementById('leaderboardPanel').classList.remove('open');
    document.getElementById('closeStats').onclick = () => document.getElementById('statsPanel').classList.remove('open');
    document.getElementById('logoutButton').onclick = async () => { await ToucanAuth.signOut(); location.href = 'auth.html'; };

    async function getProfile() {
        const user = await ToucanAuth.getUser();
        if (!user) return null;
        const { data } = await supabaseClient.from('profiles').select('id,username,total_coins').eq('id', user.id).maybeSingle();
        if (!data) { location.href = 'profile.html'; return null; }
        return { user, profile: data };
    }

    async function loadStats() {
        const result = await getProfile();
        if (!result) return;
        document.getElementById('statsName').textContent = result.profile.username || 'Player';
        document.getElementById('statsCoins').textContent = Number(result.profile.total_coins || 0).toLocaleString();
        try {
            const best = await ToucanScores.getPersonalBest('level_1');
            document.getElementById('statsBest').textContent = best == null ? '--:--.---' : formatTime(best);
        } catch { document.getElementById('statsBest').textContent = '--:--.---'; }
    }

    async function loadLeaderboard() {
        const list = document.getElementById('leaderboardList');
        list.innerHTML = '<div class="lobby-status">Loading...</div>';
        try {
            const { data, error } = await supabaseClient.rpc('get_leaderboard', { p_level_id: 'level_1' });
            if (error) throw error;
            list.innerHTML = (data || []).slice(0, 10).map((p, i) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b>#${i + 1} ${escapeHtml(p.username || 'Player')}</b><span style="color:#34d399">${formatTime(p.best_time_ms)}</span></div>`).join('') || '<div class="lobby-status">No completed runs yet.</div>';
        } catch (e) { list.innerHTML = '<div style="color:#fb7185">Leaderboard unavailable.</div>'; console.error(e); }
    }

    const escapeHtml = value => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
    const formatTime = ms => {
        const n = Math.max(0, Number(ms));
        if (!Number.isFinite(n)) return '--:--.---';
        return `${String(Math.floor(n / 60000)).padStart(2,'0')}:${String(Math.floor(n / 1000) % 60).padStart(2,'0')}.${String(Math.floor(n % 1000)).padStart(3,'0')}`;
    };

    async function requireProfile() {
        const user = await ToucanAuth.getUser();
        if (!user) { location.href = 'auth.html'; return false; }
        const { data } = await supabaseClient.from('profiles').select('id').eq('id', user.id).maybeSingle();
        if (!data) { location.href = 'profile.html'; return false; }
        document.getElementById('playerName').textContent = user.user_metadata?.username || user.email?.split('@')[0] || 'PLAYER';
        return true;
    }
    requireProfile();

    scene.onBeforeRenderObservable.add(() => {
        const dt = engine.getDeltaTime() / 1000;
        roam.t += dt;

        // Only the player's lobby avatar roams. Other avatars remain at fixed positions.
        const x = Math.sin(roam.t * 0.36) * 7.2;
        const z = Math.cos(roam.t * 0.28) * 4.6;
        player.position.x += (x - player.position.x) * Math.min(1, dt * 1.8);
        player.position.z += (z - player.position.z) * Math.min(1, dt * 1.8);
        player.position.y = 1 + Math.sin(roam.t * 3.0) * 0.08;
        player.rotation.y += dt * 0.6;

        avatars.forEach(a => {
            a.mesh.position.y = a.pos.y;
            a.mesh.position.x = a.pos.x;
            a.mesh.position.z = a.pos.z;
        });

        // Detect the nearest avatar for E interaction.
        nearbyAvatar = null;
        let nearestDistance = Infinity;
        avatars.forEach(a => {
            const distance = BABYLON.Vector3.Distance(player.position, a.mesh.position);
            if (distance < 3.0 && distance < nearestDistance) {
                nearestDistance = distance;
                nearbyAvatar = a;
            }
        });

        if (nearbyAvatar && !panel.classList.contains('open')) {
            interactPrompt.textContent = `PRESS E  ·  ${nearbyAvatar.name}`;
            interactPrompt.classList.add('visible');
        } else {
            interactPrompt.classList.remove('visible');
        }

        // Camera follows the roaming player exactly like the game camera follows its player.
        camera.target.x += (player.position.x - camera.target.x) * Math.min(1, dt * 8);
        camera.target.y += (player.position.y + 0.8 - camera.target.y) * Math.min(1, dt * 8);
        camera.target.z += (player.position.z - camera.target.z) * Math.min(1, dt * 8);
        playRing.rotation.y += dt;
    });

    engine.runRenderLoop(() => scene.render());
    addEventListener('resize', () => engine.resize());
})();